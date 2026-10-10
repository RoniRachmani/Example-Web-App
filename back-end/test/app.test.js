import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { createFakeDb } from './fake-db.js';

const users = {
  'alice-token': { uid: 'alice', email: 'alice@example.com' },
  'bob-token': { uid: 'bob', email: 'bob@example.com' },
  'carol-token': { uid: 'carol', email: 'carol@example.com', name: '  Carol  ' },
  'long-name-token': { uid: 'dave', email: 'dave@example.com', name: 'D'.repeat(80) },
  'emoji-name-token': { uid: 'erin', email: 'erin@example.com', name: 'E'.repeat(49) + '😀😀' },
  'blank-name-token': { uid: 'frank', email: 'frank@example.com', name: '   ' },
  'invisible-name-token': { uid: 'gina', email: 'gina@example.com', name: '\u200B\u200B' },
  'reversed-name-token': { uid: 'hank', email: 'hank@example.com', name: '\u202Eknah' },
};

async function verifyIdToken(token) {
  if (!users[token]) throw new Error('invalid token');
  return users[token];
}

describe('articles API', () => {
  let db;
  let server;
  let baseUrl;

  async function startServer(options) {
    server = createApp({ db, verifyIdToken, ...options }).listen(0);
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  }

  function stopServer() {
    server.closeAllConnections();
    server.close();
  }

  beforeEach(async () => {
    // No upvoteIds field, like the articles already in the database.
    db = createFakeDb([{ name: 'learn-react', upvotes: 0, comments: [] }]);
    await startServer();
  });

  afterEach(stopServer);

  function request(method, path, { token, body, headers: extraHeaders } = {}) {
    const headers = { 'content-type': 'application/json', ...extraHeaders };
    if (token) headers.authtoken = token;
    return fetch(baseUrl + path, { method, headers, body: body && JSON.stringify(body) });
  }

  describe('GET /api/articles/:name', () => {
    it('returns the article', async () => {
      const res = await request('GET', '/api/articles/learn-react');
      assert.equal(res.status, 200);
      assert.equal((await res.json()).name, 'learn-react');
    });

    it('returns 404 for an unknown article', async () => {
      const res = await request('GET', '/api/articles/nope');
      assert.equal(res.status, 404);
    });

    it("doesn't reveal who upvoted or commenters' uids", async () => {
      db.docs[0]._id = 'abc123';
      db.docs[0].upvotes = 1;
      db.docs[0].upvoteIds = ['alice'];
      db.docs[0].comments = [{ uid: 'carol', postedBy: 'Carol', text: 'hi' }];

      const res = await request('GET', '/api/articles/learn-react');
      assert.deepEqual(await res.json(), {
        name: 'learn-react',
        upvotes: 1,
        upvoted: false,
        comments: [{ postedBy: 'Carol', text: 'hi' }],
      });
    });

    it('says whether the signed-in user has upvoted', async () => {
      db.docs[0].upvoteIds = ['alice'];

      const alice = await request('GET', '/api/articles/learn-react', { token: 'alice-token' });
      const bob = await request('GET', '/api/articles/learn-react', { token: 'bob-token' });
      assert.equal((await alice.json()).upvoted, true);
      assert.equal((await bob.json()).upvoted, false);
    });

    it('treats an invalid token as a signed-out visitor', async () => {
      db.docs[0].upvoteIds = ['alice'];

      const res = await request('GET', '/api/articles/learn-react', { token: 'garbage' });
      assert.equal(res.status, 200);
      assert.equal((await res.json()).upvoted, false);
    });
  });

  describe('front-end files', () => {
    let distDir;

    beforeEach(async () => {
      distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blogify-dist-'));
      fs.mkdirSync(path.join(distDir, 'assets'));
      fs.writeFileSync(path.join(distDir, 'index.html'), '<script src="/assets/index-abc123.js"></script>');
      fs.writeFileSync(path.join(distDir, 'favicon.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
      fs.writeFileSync(path.join(distDir, 'assets/index-abc123.js'), 'console.log(1)');

      stopServer();
      await startServer({ distDir });
    });

    afterEach(() => fs.rmSync(distDir, { recursive: true }));

    // What a browser sends when it revalidates a copy it already has.
    const revalidate = { 'if-none-match': '*', 'if-modified-since': new Date(Date.now() + 60_000).toUTCString() };

    function assertAlwaysSentInFull(res) {
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('cache-control'), 'no-cache');
      assert.equal(res.headers.get('etag'), null);
      assert.equal(res.headers.get('last-modified'), null);
    }

    for (const page of ['/', '/index.html', '/articles/learn-react']) {
      it(`sends index.html in full for ${page}, even to a browser that has a copy`, async () => {
        const res = await request('GET', page, { headers: revalidate });
        assertAlwaysSentInFull(res);
        assert.match(await res.text(), /index-abc123\.js/);
      });
    }

    it('sends other unhashed files in full too', async () => {
      const res = await request('GET', '/favicon.svg', { headers: revalidate });
      assertAlwaysSentInFull(res);
      assert.match(res.headers.get('content-type'), /svg/);
    });

    it('lets browsers keep hashed assets for good', async () => {
      const res = await request('GET', '/assets/index-abc123.js');
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('cache-control'), 'public, max-age=31536000, immutable');
      assert.equal(await res.text(), 'console.log(1)');
    });

    it('returns 404 for a page when the front end has not been built', async () => {
      fs.rmSync(path.join(distDir, 'index.html'));
      const res = await request('GET', '/articles/learn-react');
      assert.equal(res.status, 404);
    });

    it("returns 404 for an asset from an older build, not index.html", async () => {
      const res = await request('GET', '/assets/index-old999.js');
      assert.equal(res.status, 404);
      assert.doesNotMatch(await res.text(), /<script/);
    });
  });

  describe('security headers', () => {
    function assertSecurityHeaders(res) {
      assert.match(res.headers.get('strict-transport-security'), /max-age=\d+/);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
      assert.equal(res.headers.get('x-powered-by'), null);
    }

    it('are set on API responses', async () => {
      assertSecurityHeaders(await request('GET', '/api/articles/learn-react'));
    });

    it('are set on error responses', async () => {
      assertSecurityHeaders(await request('POST', '/api/articles/learn-react/upvote'));
    });

    it('are set when the rate limiter rejects a request', async () => {
      stopServer();
      await startServer({ rateLimits: { windowMs: 60_000, requests: 1, writes: 1 } });
      await request('GET', '/api/articles/learn-react');

      const res = await request('GET', '/api/articles/learn-react');
      assert.equal(res.status, 429);
      assertSecurityHeaders(res);
    });

    it('allow scripts only from this site and Google Analytics', async () => {
      const res = await request('GET', '/api/articles/learn-react');
      const policy = res.headers.get('content-security-policy');
      assert.match(policy, /default-src 'self'/);
      assert.match(policy, /script-src 'self' https:\/\/\*\.googletagmanager\.com(;|$)/);
      assert.match(policy, /object-src 'none'/);
    });

    it('send only the origin as the referrer to other sites', async () => {
      const res = await request('GET', '/api/articles/learn-react');
      assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    });

    it('let the page reach Firebase Auth', async () => {
      const res = await request('GET', '/api/articles/learn-react');
      // A set of whole sources, so each host is matched exactly rather than as a substring.
      const connectSrc = new Set(res.headers.get('content-security-policy').match(/connect-src ([^;]+)/)[1].split(' '));
      assert.ok(connectSrc.has('https://identitytoolkit.googleapis.com'));
      assert.ok(connectSrc.has('https://securetoken.googleapis.com'));
    });
  });

  describe('auth', () => {
    it('returns 401 without a token', async () => {
      const res = await request('POST', '/api/articles/learn-react/upvote');
      assert.equal(res.status, 401);
    });

    it('returns 401 for an invalid token', async () => {
      const res = await request('POST', '/api/articles/learn-react/upvote', { token: 'garbage' });
      assert.equal(res.status, 401);
    });
  });

  describe('POST /api/articles/:name/upvote', () => {
    it('counts an upvote', async () => {
      const res = await request('POST', '/api/articles/learn-react/upvote', { token: 'alice-token' });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.upvotes, 1);
      assert.equal(body.upvoted, true);
      assert.equal(body.upvoteIds, undefined);
      assert.deepEqual(db.docs[0].upvoteIds, ['alice']);
    });

    it('returns 403 when the user has already upvoted', async () => {
      await request('POST', '/api/articles/learn-react/upvote', { token: 'alice-token' });
      const res = await request('POST', '/api/articles/learn-react/upvote', { token: 'alice-token' });
      assert.equal(res.status, 403);
      assert.equal(db.docs[0].upvotes, 1);
    });

    it('counts two simultaneous upvotes by one user once', async () => {
      const responses = await Promise.all([1, 2].map(() =>
        request('POST', '/api/articles/learn-react/upvote', { token: 'alice-token' })));
      assert.deepEqual(responses.map(r => r.status).sort(), [200, 403]);
      assert.equal(db.docs[0].upvotes, 1);
    });

    it('counts upvotes from different users', async () => {
      await request('POST', '/api/articles/learn-react/upvote', { token: 'alice-token' });
      const res = await request('POST', '/api/articles/learn-react/upvote', { token: 'bob-token' });
      assert.equal(res.status, 200);
      assert.equal(db.docs[0].upvotes, 2);
    });

    it('returns 404 for an unknown article', async () => {
      const res = await request('POST', '/api/articles/nope/upvote', { token: 'alice-token' });
      assert.equal(res.status, 404);
    });
  });

  describe('POST /api/articles/:name/comments', () => {
    it('saves the comment under the signed-in user, ignoring postedBy in the body', async () => {
      const res = await request('POST', '/api/articles/learn-react/comments', {
        token: 'alice-token',
        body: { postedBy: 'bob@example.com', text: '  Nice article  ' },
      });
      assert.equal(res.status, 200);
      assert.deepEqual(db.docs[0].comments, [{ uid: 'alice', postedBy: 'Anonymous', text: 'Nice article' }]);
      assert.deepEqual((await res.json()).comments, [{ postedBy: 'Anonymous', text: 'Nice article' }]);
    });

    it("stores the author's uid, so a copied display name can be told apart", async () => {
      await request('POST', '/api/articles/learn-react/comments', { token: 'alice-token', body: { text: 'one' } });
      await request('POST', '/api/articles/learn-react/comments', { token: 'blank-name-token', body: { text: 'two' } });
      const [first, second] = db.docs[0].comments;
      assert.equal(first.postedBy, second.postedBy);
      assert.equal(first.uid, 'alice');
      assert.equal(second.uid, 'frank');
    });

    it('never publishes the email address of a user without a display name', async () => {
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'alice-token', body: { text: 'hi' } });
      assert.doesNotMatch(await res.text(), /alice@example\.com/);
      assert.doesNotMatch(JSON.stringify(db.docs), /alice@example\.com/);
    });

    it('uses the display name from the token, trimmed', async () => {
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'carol-token', body: { text: 'hi' } });
      assert.equal(res.status, 200);
      assert.equal((await res.json()).comments[0].postedBy, 'Carol');
    });

    it('cuts a long display name to 50 characters', async () => {
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'long-name-token', body: { text: 'hi' } });
      assert.equal((await res.json()).comments[0].postedBy, 'D'.repeat(50));
    });

    it('does not split an emoji when cutting a display name', async () => {
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'emoji-name-token', body: { text: 'hi' } });
      assert.equal((await res.json()).comments[0].postedBy, 'E'.repeat(49) + '😀');
    });

    it('shows Anonymous when the display name is blank', async () => {
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'blank-name-token', body: { text: 'hi' } });
      assert.equal((await res.json()).comments[0].postedBy, 'Anonymous');
    });

    it('shows Anonymous when the display name is only invisible characters', async () => {
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'invisible-name-token', body: { text: 'hi' } });
      assert.equal((await res.json()).comments[0].postedBy, 'Anonymous');
    });

    it('strips bidi overrides from the display name', async () => {
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'reversed-name-token', body: { text: 'hi' } });
      assert.equal((await res.json()).comments[0].postedBy, 'knah');
    });

    it('accepts text of exactly 1000 characters', async () => {
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'alice-token', body: { text: 'x'.repeat(1000) } });
      assert.equal(res.status, 200);
    });

    it('counts an emoji as one character in the text limit', async () => {
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'alice-token', body: { text: '😀'.repeat(1000) } });
      assert.equal(res.status, 200);
    });

    it('returns 400 for text over 1000 characters', async () => {
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'alice-token', body: { text: 'x'.repeat(1001) } });
      assert.equal(res.status, 400);
      assert.deepEqual(db.docs[0].comments, []);
    });

    it('returns 400 for empty text', async () => {
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'alice-token', body: { text: '   ' } });
      assert.equal(res.status, 400);
      assert.deepEqual(db.docs[0].comments, []);
    });

    it('returns 400 without a body', async () => {
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'alice-token' });
      assert.equal(res.status, 400);
    });

    it('returns 404 for an unknown article', async () => {
      const res = await request('POST', '/api/articles/nope/comments', { token: 'alice-token', body: { text: 'hi' } });
      assert.equal(res.status, 404);
    });
  });

  describe('rate limiting', () => {
    beforeEach(async () => {
      stopServer();
      await startServer({ rateLimits: { windowMs: 60_000, requests: 5, writes: 2 } });
    });

    it('returns 429 once a client has made too many requests', async () => {
      for (let i = 0; i < 5; i++) {
        assert.equal((await request('GET', '/api/articles/learn-react')).status, 200);
      }
      assert.equal((await request('GET', '/api/articles/learn-react')).status, 429);
    });

    it('counts clients by the App Engine client IP header', async () => {
      for (let i = 0; i < 5; i++) {
        await request('GET', '/api/articles/learn-react', { headers: { 'x-appengine-user-ip': '203.0.113.1' } });
      }
      const blocked = await request('GET', '/api/articles/learn-react', { headers: { 'x-appengine-user-ip': '203.0.113.1' } });
      const other = await request('GET', '/api/articles/learn-react', { headers: { 'x-appengine-user-ip': '203.0.113.2' } });
      assert.equal(blocked.status, 429);
      assert.equal(other.status, 200);
    });

    it('limits upvotes and comments per user', async () => {
      await request('POST', '/api/articles/learn-react/comments', { token: 'alice-token', body: { text: 'one' } });
      await request('POST', '/api/articles/learn-react/upvote', { token: 'alice-token' });
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'alice-token', body: { text: 'three' } });
      assert.equal(res.status, 429);
      assert.deepEqual(db.docs[0].comments.map(c => c.text), ['one']);
    });

    it("doesn't count one user's writes against another", async () => {
      await request('POST', '/api/articles/learn-react/comments', { token: 'alice-token', body: { text: 'one' } });
      await request('POST', '/api/articles/learn-react/comments', { token: 'alice-token', body: { text: 'two' } });
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'bob-token', body: { text: 'hi' } });
      assert.equal(res.status, 200);
    });
  });
});
