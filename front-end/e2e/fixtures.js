import { test as base, expect } from '@playwright/test';

// The app talks to Firebase Auth's REST API and to our /api routes. These fakes
// answer both inside the browser, so the tests need no Firebase project, back
// end or network access.

const b64url = value => Buffer.from(JSON.stringify(value)).toString('base64url');
const decodeToken = token => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': '*',
};

function createFakeFirebase() {
  const accounts = new Map();
  let nextUid = 1;

  const firebase = {
    // Tests can change these before acting.
    failProfileUpdate: false,
    profileUpdateReturnsToken: true,
    // Endpoint names in call order, e.g. 'accounts:signUp'.
    calls: [],

    addAccount({ email, password, displayName = '' }) {
      const account = { uid: `uid-${nextUid++}`, email, password, displayName };
      accounts.set(email, account);
      return account;
    },

    account(email) {
      return accounts.get(email);
    },
  };

  // An unsigned ID token. The Firebase web SDK reads its claims but doesn't
  // verify the signature; the real server does, which these tests don't cover.
  function idToken(account) {
    const now = Math.floor(Date.now() / 1000);
    return [b64url({ alg: 'none', typ: 'JWT' }), b64url({
      iss: 'fake-firebase',
      aud: 'fake-project',
      sub: account.uid,
      user_id: account.uid,
      email: account.email,
      name: account.displayName || undefined,
      iat: now,
      exp: now + 3600,
      auth_time: now,
      firebase: { sign_in_provider: 'password' },
    }), 'unsigned'].join('.');
  }

  const tokens = account => ({ idToken: idToken(account), refreshToken: `refresh-${account.uid}`, expiresIn: '3600' });
  const byUid = uid => [...accounts.values()].find(a => a.uid === uid);
  const byIdToken = token => byUid(decodeToken(token).user_id);

  const userInfo = account => ({
    localId: account.uid,
    email: account.email,
    displayName: account.displayName,
    emailVerified: false,
    providerUserInfo: [{ providerId: 'password', email: account.email, federatedId: account.email, rawId: account.email, displayName: account.displayName }],
    passwordUpdatedAt: 1,
    validSince: '1',
    lastLoginAt: '1',
    createdAt: '1',
  });

  const error = message => ({ status: 400, body: { error: { code: 400, message, errors: [{ message, domain: 'global', reason: 'invalid' }] } } });

  // Returns { status, body } for a request to identitytoolkit or securetoken.
  firebase.handle = (endpoint, body) => {
    firebase.calls.push(endpoint);

    switch (endpoint) {
      case 'accounts:signUp': {
        if (accounts.has(body.email)) return error('EMAIL_EXISTS');
        const account = firebase.addAccount({ email: body.email, password: body.password });
        return { status: 200, body: { kind: 'identitytoolkit#SignupNewUserResponse', localId: account.uid, email: account.email, ...tokens(account) } };
      }
      case 'accounts:signInWithPassword': {
        const account = accounts.get(body.email);
        if (!account || account.password !== body.password) return error('INVALID_LOGIN_CREDENTIALS');
        return { status: 200, body: { kind: 'identitytoolkit#VerifyPasswordResponse', localId: account.uid, email: account.email, displayName: account.displayName, registered: true, ...tokens(account) } };
      }
      case 'accounts:lookup':
        return { status: 200, body: { kind: 'identitytoolkit#GetAccountInfoResponse', users: [userInfo(byIdToken(body.idToken))] } };
      case 'accounts:update': {
        if (firebase.failProfileUpdate) return error('INTERNAL_ERROR');
        const account = byIdToken(body.idToken);
        if ('displayName' in body) account.displayName = body.displayName;
        return { status: 200, body: {
          kind: 'identitytoolkit#SetAccountInfoResponse',
          ...userInfo(account),
          ...(firebase.profileUpdateReturnsToken ? tokens(account) : {}),
        } };
      }
      case 'token': {
        const account = byUid(body.refresh_token.replace(/^refresh-/, ''));
        const { idToken: token, refreshToken, expiresIn } = tokens(account);
        return { status: 200, body: { access_token: token, id_token: token, refresh_token: refreshToken, expires_in: expiresIn, token_type: 'Bearer', user_id: account.uid, project_id: 'fake-project' } };
      }
      default:
        return { status: 200, body: {} };
    }
  };

  return firebase;
}

// Stands in for back-end/src/app.js. Like the real server, it takes the comment
// author from the verified token's name claim, falling back to the email.
function createFakeApi() {
  const articles = new Map([['learn-react', { name: 'learn-react', upvotes: 0, upvoteIds: [], comments: [] }]]);

  const api = {
    // Each comment posted, with the claims of the token it was sent with.
    posted: [],

    handle(method, path, headers, body) {
      const match = path.match(/^\/api\/articles\/([^/]+)(\/comments|\/upvote)?$/);
      const article = match && articles.get(match[1]);
      if (!article) return { status: 404 };
      if (method === 'GET') return { status: 200, body: article };

      if (!headers.authtoken) return { status: 401 };
      const claims = decodeToken(headers.authtoken);

      if (match[2] === '/comments') {
        const comment = { postedBy: claims.name || claims.email, text: body.text.trim() };
        article.comments.push(comment);
        api.posted.push({ ...comment, claims });
      } else {
        article.upvotes += 1;
        article.upvoteIds.push(claims.user_id);
      }
      return { status: 200, body: article };
    },
  };

  return api;
}

function parseBody(request) {
  const data = request.postData();
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch {
    // The token endpoint sends a form-encoded body.
    return Object.fromEntries(new URLSearchParams(data));
  }
}

// Both fakes are set up for every test (auto), whether or not it uses them.
export const test = base.extend({
  firebase: [async ({ context }, use) => {
    const firebase = createFakeFirebase();

    // Registered first so the more specific routes below take priority. Anything
    // else leaving the machine (Analytics, Firebase Installations) gets an empty
    // reply rather than reaching the internet.
    await context.route(url => url.hostname !== 'localhost', route => route.fulfill({ status: 200, headers: CORS, json: {} }));

    await context.route(/identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com/, async route => {
      const request = route.request();
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });

      const endpoint = new URL(request.url()).pathname.split('/').pop();
      const { status, body } = firebase.handle(endpoint, parseBody(request));
      await route.fulfill({ status, headers: CORS, json: body });
    });

    await use(firebase);
  }, { auto: true }],

  api: [async ({ context }, use) => {
    const api = createFakeApi();

    await context.route('**/api/**', async route => {
      const request = route.request();
      const { status, body } = api.handle(request.method(), new URL(request.url()).pathname, request.headers(), parseBody(request));
      await route.fulfill(body === undefined ? { status } : { status, json: body });
    });

    await use(api);
  }, { auto: true }],

  // Fails the test if the page throws an uncaught error.
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await use(page);

    expect(errors, 'uncaught errors in the page').toEqual([]);
  },
});

export { expect };

export async function logIn(page, { email, password }) {
  await page.goto('/login');
  await page.getByPlaceholder('Your email address').fill(email);
  await page.getByPlaceholder('Your password').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
}

export async function fillSignUpForm(page, { displayName, email = 'bob@example.com', password = 'secret123', confirmPassword = password }) {
  await page.goto('/create-account');
  await page.getByPlaceholder('Display name').fill(displayName);
  await page.getByPlaceholder('Your email address').fill(email);
  await page.getByPlaceholder('Your password').fill(password);
  await page.getByPlaceholder('Confirm password').fill(confirmPassword);
}

export async function postComment(page, article, text) {
  await page.goto(`/articles/${article}`);
  await page.getByLabel('Comment').fill(text);
  await page.getByRole('button', { name: 'Add Comment' }).click();
}
