import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { anonymizeCommentEmails, EMAIL_PATTERN } from '../scripts/anonymize-comment-emails.js';
import { createFakeDb } from './fake-db.js';

const articles = () => [
  {
    name: 'learn-react',
    upvotes: 2,
    upvoteIds: ['alice', 'bob'],
    comments: [
      { uid: 'alice', postedBy: 'alice@example.com', text: 'Great!' },
      { uid: 'bob', postedBy: 'Bob', text: 'Thanks' },
      { postedBy: 'Carol.Smith@Example.CO.UK', text: 'From before uids were saved' },
      { uid: 'dave', postedBy: 'Anonymous', text: 'hi' },
    ],
  },
  { name: 'learn-node', upvotes: 0, upvoteIds: [], comments: [{ uid: 'erin', postedBy: 'Erin', text: 'Nice' }] },
  { name: 'mongodb', upvotes: 0, upvoteIds: [], comments: [{ uid: 'frank', postedBy: 'frank@example.org', text: 'ok' }] },
  // Some articles in the database have never had a comment.
  { name: 'empty', upvotes: 0 },
];

describe('anonymize-comment-emails script', () => {
  it('counts comments that show an email, per article, without changing anything', async () => {
    const db = createFakeDb(articles());

    const counts = await anonymizeCommentEmails(db);

    assert.deepEqual(counts, { 'learn-react': 2, mongodb: 1 });
    assert.deepEqual(db.docs, articles());
  });

  it('with apply, replaces only those names, keeping every other field', async () => {
    const db = createFakeDb(articles());

    const counts = await anonymizeCommentEmails(db, { apply: true });

    assert.deepEqual(counts, { 'learn-react': 2, mongodb: 1 });
    const expected = articles();
    expected[0].comments[0].postedBy = 'Anonymous';
    expected[0].comments[2].postedBy = 'Anonymous';
    expected[2].comments[0].postedBy = 'Anonymous';
    assert.deepEqual(db.docs, expected);
    assert.deepEqual(await anonymizeCommentEmails(db), {});
  });

  it('does nothing when no comment shows an email', async () => {
    const db = createFakeDb([articles()[1]]);
    assert.deepEqual(await anonymizeCommentEmails(db, { apply: true }), {});
    assert.deepEqual(db.docs, [articles()[1]]);
  });

  it('treats only email-shaped names as emails', () => {
    for (const name of ['alice@example.com', 'A.B+tag@sub.example.co.uk', 'x@y.z']) {
      assert.match(name, EMAIL_PATTERN);
    }
    for (const name of ['Alice', '@alice', 'Bob @ home', 'alice@localhost', 'me@ example.com', 'Anonymous', 'a@b@c.com']) {
      assert.doesNotMatch(name, EMAIL_PATTERN);
    }
  });
});
