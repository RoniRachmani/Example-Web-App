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
    req.user = await getAuth().verifyIdToken(authtoken);
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

const PORT = process.env.PORT || 8000;

async function start() {
  await connectToDB();
  app.listen(PORT, function () {
    console.log('Server is listening on port ' + PORT);
  });
}

start();