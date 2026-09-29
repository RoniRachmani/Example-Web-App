import express from 'express';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentials = JSON.parse(
  fs.readFileSync('./credentials.json')
);

initializeApp({
  credential: cert(credentials)
});

const app = express();

const MAX_COMMENT_LENGTH = 1000;
// Matches the limit on the display name field in CreateAccountPage.jsx.
const MAX_DISPLAY_NAME_LENGTH = 50;

// The name claim is set by the user, so the sign-up form's limit can be
// bypassed. Truncate rather than reject so a long name can't block commenting.
function getDisplayName(user) {
  const name = typeof user.name === 'string' ? user.name.trim() : '';
  return [...name].slice(0, MAX_DISPLAY_NAME_LENGTH).join('');
}

app.use(express.json());

let db;

async function connectToDB() {
  const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.yyink.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();

  db = client.db('full-stack-react-db');
}

app.use(express.static(path.join(__dirname, '../dist')))

app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.get('/api/articles/:name', async (req, res) => {
  const { name } = req.params;
  const article = await db.collection('articles').findOne({ name });

  if (!article) {
    return res.sendStatus(404);
  }

  res.json(article);
});

app.use(async function (req, res, next) {
  const { authtoken } = req.headers;

  if (!authtoken) {
    return res.sendStatus(401);
  }

  try {
    req.user = await getAuth().verifyIdToken(authtoken);
  } catch {
    return res.sendStatus(401);
  }

  next();
});

app.post('/api/articles/:name/upvote', async (req, res) => {
  const { name } = req.params;
  const { uid } = req.user;

  const article = await db.collection('articles').findOne({ name });

  if (!article) {
    return res.sendStatus(404);
  }

  const upvoteIds = article.upvoteIds || [];
  const canUpvote = uid && !upvoteIds.includes(uid);

  if (canUpvote) {
    const updatedArticle = await db.collection('articles').findOneAndUpdate({ name }, {
      $inc: { upvotes: 1 },
      $push: { upvoteIds: uid },
    }, {
      returnDocument: "after",
    });

    res.json(updatedArticle);
  } else {
    res.sendStatus(403);
  }
});

app.post('/api/articles/:name/comments', async (req, res) => {
  const { name } = req.params;
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

  if (!text || text.length > MAX_COMMENT_LENGTH) {
    return res.status(400).json({
      error: `Comment text must be between 1 and ${MAX_COMMENT_LENGTH} characters`,
    });
  }

  const postedBy = getDisplayName(req.user) || req.user.email || 'Anonymous';
  const newComment = { postedBy, text };

  const updatedArticle = await db.collection('articles').findOneAndUpdate({ name }, {
    $push: { comments: newComment }
  }, {
    returnDocument: 'after',
  });

  if (!updatedArticle) {
    return res.sendStatus(404);
  }

  res.json(updatedArticle);
});

const PORT = process.env.PORT || 8000;

async function start() {
  await connectToDB();
  app.listen(PORT, function () {
    console.log('Server is listening on port ' + PORT);
  });
}

start();