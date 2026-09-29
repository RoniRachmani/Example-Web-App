import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { createFakeDb } from './fake-db.js';

const users = {
  'alice-token': { uid: 'alice', email: 'alice@example.com' },
  'bob-token': { uid: 'bob', email: 'bob@example.com' },
  'carol-token': { uid: 'carol', email: 'carol@example.com', name: '  Carol  ' },
  'long-name-token': { uid: 'dave', email: 'dave@example.com', name: 'D'.repeat(80) },
  'emoji-name-token': { uid: 'erin', email: 'erin@example.com', name: 'E'.repeat(49) + '😀😀' },
  'blank-name-token': { uid: 'frank', email: 'frank@example.com', name: '   ' },
  'impostor-token': { uid: 'mallory', email: 'mallory@example.com', name: 'alice@example.com' },
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
      assert.equal((await res.json()).upvotes, 1);
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
      assert.deepEqual((await res.json()).comments, [{ uid: 'alice', postedBy: 'alice@example.com', text: 'Nice article' }]);
    });

    it("keeps the author's uid, so a copied display name can be told apart", async () => {
      await request('POST', '/api/articles/learn-react/comments', { token: 'alice-token', body: { text: 'real' } });
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'impostor-token', body: { text: 'fake' } });
      const [real, fake] = (await res.json()).comments;
      assert.equal(real.postedBy, fake.postedBy);
      assert.equal(real.uid, 'alice');
      assert.equal(fake.uid, 'mallory');
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

    it('falls back to the email when the display name is blank', async () => {
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'blank-name-token', body: { text: 'hi' } });
      assert.equal((await res.json()).comments[0].postedBy, 'frank@example.com');
    });

    it('falls back to the email when the display name is only invisible characters', async () => {
      const res = await request('POST', '/api/articles/learn-react/comments', { token: 'invisible-name-token', body: { text: 'hi' } });
      assert.equal((await res.json()).comments[0].postedBy, 'gina@example.com');
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
