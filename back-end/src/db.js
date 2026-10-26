import { MongoClient, ServerApiVersion } from 'mongodb';

export const DB_NAME = 'full-stack-react-db';

// The connection string, from the environment. Call dotenv.config() first.
export function mongoUri() {
  // MONGODB_URI lets local development point at another database, such as a local mongod.
  return process.env.MONGODB_URI
    || `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.yyink.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
}

// Connects to the app's database. Call dotenv.config() first: the credentials
// come from the environment. Returns the client too, so scripts can close it.
export async function connectToDB() {
  const client = new MongoClient(mongoUri(), {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();

  return { client, db: client.db(DB_NAME) };
}
