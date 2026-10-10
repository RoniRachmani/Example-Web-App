import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectToDB } from './db.js';
dotenv.config();

const credentials = JSON.parse(
  fs.readFileSync('./credentials.json')
);

initializeApp({
  credential: cert(credentials)
});

const PORT = process.env.PORT || 8000;

async function start() {
  const { db } = await connectToDB();
  const app = createApp({ db, verifyIdToken: token => getAuth().verifyIdToken(token) });

  app.listen(PORT, function () {
    console.log('Server is listening on port ' + PORT);
  });
}

start();
