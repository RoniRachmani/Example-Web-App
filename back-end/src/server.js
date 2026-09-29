import { MongoClient, ServerApiVersion } from 'mongodb';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import dotenv from 'dotenv';
import { createApp } from './app.js';
dotenv.config();

const credentials = JSON.parse(
  fs.readFileSync('./credentials.json')
);

initializeApp({
  credential: cert(credentials)
});

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

  return client.db('full-stack-react-db');
}

const PORT = process.env.PORT || 8000;

async function start() {
  const db = await connectToDB();
  const app = createApp({ db, verifyIdToken: token => getAuth().verifyIdToken(token) });

  app.listen(PORT, function () {
    console.log('Server is listening on port ' + PORT);
  });
}

start();
