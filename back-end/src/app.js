import express from 'express';
import path from 'path';

import { MAX_COMMENT_LENGTH, countChars, normalizeDisplayName } from './text.js';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The name claim is set by the user, so the front end's checks can be
// bypassed. Truncate rather than reject so a long name can't block commenting.
function getDisplayName(user) {
  return typeof user.name === 'string' ? normalizeDisplayName(user.name) : '';
}

// db is a connected MongoDB database, and verifyIdToken checks a Firebase ID token
// and resolves to its decoded claims. They're passed in so tests can use fakes.
export function createApp({ db, verifyIdToken }) {
  const app = express();

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

  app.post('/api/articles/:name/upvote', async (req, res) => {
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

  app.post('/api/articles/:name/comments', async (req, res) => {
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
