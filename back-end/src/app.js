import express from 'express';
import path from 'path';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    if (typeof text !== 'string' || !text.trim()) {
      return res.sendStatus(400);
    }

    const newComment = { postedBy: req.user.email, text: text.trim() };

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
