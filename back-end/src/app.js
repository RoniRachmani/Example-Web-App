import express from 'express';
import path from 'path';
import helmet from 'helmet';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

import { MAX_COMMENT_LENGTH, countChars, normalizeDisplayName } from './text.js';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The name claim is set by the user, so the front end's checks can be
// bypassed. Truncate rather than reject so a long name can't block commenting.
function getDisplayName(user) {
  return typeof user.name === 'string' ? normalizeDisplayName(user.name) : '';
}

// Per window: `requests` is for any route, per client IP (a page load is a handful
// of requests), and `writes` is for upvotes and comments, per signed-in user.
// Counts are kept in memory, so each App Engine instance counts separately.
export const DEFAULT_RATE_LIMITS = {
  windowMs: 15 * 60 * 1000,
  requests: 1000,
  writes: 30,
};

// App Engine sets X-AppEngine-User-IP to the client's address and drops any copy
// the client sends, so it can't be spoofed there. Behind App Engine's proxies
// req.ip isn't the client, so it's only the fallback for local runs and tests.
function clientIp(req) {
  return req.get('x-appengine-user-ip') ?? req.ip;
}

// Everything the page loads comes from this server, except the Firebase SDK's
// calls to Firebase Auth and Google Analytics. Add a host here when the front
// end starts using another outside service, or the browser will block it.
const CONTENT_SECURITY_POLICY = {
  directives: {
    scriptSrc: ["'self'", 'https://*.googletagmanager.com'],
    connectSrc: [
      "'self'",
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      'https://firebaseinstallations.googleapis.com',
      'https://firebase.googleapis.com',
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://*.googletagmanager.com',
    ],
    imgSrc: ["'self'", 'data:', 'https://*.google-analytics.com', 'https://*.googletagmanager.com'],
  },
};

// db is a connected MongoDB database, and verifyIdToken checks a Firebase ID token
// and resolves to its decoded claims. They're passed in so tests can use fakes.
export function createApp({ db, verifyIdToken, rateLimits = DEFAULT_RATE_LIMITS }) {
  const app = express();

  // First, so every response gets the security headers, including a 429 from the
  // rate limiter. Also removes X-Powered-By. The redirect from HTTP to HTTPS is
  // App Engine's job (`secure: always` in app.yaml).
  app.use(helmet({
    contentSecurityPolicy: CONTENT_SECURITY_POLICY,
    // helmet's default sends no referrer at all. Firebase's API key can be limited
    // to requests from this site, which Google checks by the referrer, so send the
    // origin (never the path) to other sites.
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  app.use(rateLimit({
    windowMs: rateLimits.windowMs,
    limit: rateLimits.requests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: req => ipKeyGenerator(clientIp(req)),
    // App Engine adds X-Forwarded-For, but the key doesn't use req.ip there
    validate: { xForwardedForHeader: false },
  }));

  const writeLimit = rateLimit({
    windowMs: rateLimits.windowMs,
    limit: rateLimits.writes,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // Runs after the auth middleware, so every request here has a verified user
    keyGenerator: req => req.user.uid,
    validate: { xForwardedForHeader: false },
  });

  app.use(express.json());

  app.use(express.static(path.join(__dirname, '../dist')))

  app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });

  app.get('/api/articles/:name', async (req, res) => {
    const { name } = req.params;
    const article = await db.collection('articles').findOne({ name });

    if (article) {
      res.json(article);
    } else {
      res.sendStatus(404);
    }
  });

  app.use(async function (req, res, next) {
    const { authtoken } = req.headers;

    if (!authtoken) {
      return res.sendStatus(401);
    }

    try {
      req.user = await verifyIdToken(authtoken);
    } catch {
      return res.sendStatus(401);
    }

    next();
  });

  app.post('/api/articles/:name/upvote', writeLimit, async (req, res) => {
    const { name } = req.params;
    const { uid } = req.user;

    // Checking upvoteIds in the filter makes the check and the update one atomic step,
    // so two requests at once can't both count.
    const updatedArticle = await db.collection('articles').findOneAndUpdate({ name, upvoteIds: { $ne: uid } }, {
      $inc: { upvotes: 1 },
      $push: { upvoteIds: uid },
    }, {
      returnDocument: "after",
    });

    if (updatedArticle) {
      res.json(updatedArticle);
    } else if (await db.collection('articles').findOne({ name })) {
      res.sendStatus(403);
    } else {
      res.sendStatus(404);
    }
  });

  app.post('/api/articles/:name/comments', writeLimit, async (req, res) => {
    const { name } = req.params;
    const { text } = req.body ?? {};

    const trimmedText = typeof text === 'string' ? text.trim() : '';

    if (!trimmedText || countChars(trimmedText) > MAX_COMMENT_LENGTH) {
      return res.sendStatus(400);
    }

    const postedBy = getDisplayName(req.user) || req.user.email;
    // Display names aren't unique and anyone can pick any name, so keep the author's
    // uid too: it's what tells two commenters with the same name apart.
    const newComment = { uid: req.user.uid, postedBy, text: trimmedText };

    const updatedArticle = await db.collection('articles').findOneAndUpdate({ name }, {
      $push: { comments: newComment }
    }, {
      returnDocument: 'after',
    });

    if (updatedArticle) {
      res.json(updatedArticle);
    } else {
      res.sendStatus(404);
    }
  });

  return app;
}
