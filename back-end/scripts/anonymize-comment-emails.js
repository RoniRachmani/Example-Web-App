// One-off clean-up. Comments by users without a display name used to be saved
// with the author's email address as postedBy. This replaces every postedBy that
// looks like an email address with the placeholder name the server uses now.
//
// Run from back-end/, with the same .env (or MONGODB_URI) as the server:
//   npm run anonymize-emails              # dry run: only counts the comments
//   npm run anonymize-emails -- --apply   # replaces them
import dotenv from 'dotenv';
import { connectToDB } from '../src/db.js';
import { ANONYMOUS_NAME } from '../src/app.js';

// No spaces, one @, and a dot after it. Display names are free text, so a name
// shaped like an email is either someone's address or a copy of one used to
// impersonate them; either way it shouldn't be shown.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns { articleName: number of comments with an email as postedBy } for the
// articles that have any, counted before the change. Changes nothing unless apply.
export async function anonymizeCommentEmails(db, { apply = false } = {}) {
  const articles = db.collection('articles');
  const filter = { 'comments.postedBy': { $regex: EMAIL_PATTERN } };

  const found = await articles.find(filter, { projection: { name: 1, comments: 1 } }).toArray();
  const counts = Object.fromEntries(found.map(article => [
    article.name,
    article.comments.filter(comment => EMAIL_PATTERN.test(comment.postedBy)).length,
  ]));

  if (apply && found.length) {
    // One update that sets postedBy on the matching comments only, so comments
    // posted while it runs, and every other field, are left alone.
    await articles.updateMany(filter, {
      $set: { 'comments.$[comment].postedBy': ANONYMOUS_NAME },
    }, {
      arrayFilters: [{ 'comment.postedBy': { $regex: EMAIL_PATTERN } }],
    });
  }

  return counts;
}

if (import.meta.main) {
  dotenv.config();
  const apply = process.argv.includes('--apply');
  const { client, db } = await connectToDB();

  try {
    const counts = await anonymizeCommentEmails(db, { apply });
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    // Names and counts only: the addresses themselves aren't printed.
    for (const [name, count] of Object.entries(counts)) {
      console.log(`${name}: ${count}`);
    }

    if (!total) {
      console.log('No comments show an email address.');
    } else if (apply) {
      const left = Object.keys(await anonymizeCommentEmails(db)).length;
      console.log(`Replaced the author of ${total} comment(s) with "${ANONYMOUS_NAME}". Articles still showing an email: ${left}.`);
    } else {
      console.log(`${total} comment(s) show an email address. Run again with --apply to replace them with "${ANONYMOUS_NAME}".`);
    }
  } finally {
    await client.close();
  }
}
