import { MongoClient, ServerApiVersion } from 'mongodb';

// Connects to the app's database. Call dotenv.config() first: the credentials
// come from the environment. Returns the client too, so scripts can close it.
export async function connectToDB() {
  // MONGODB_URI lets local development point at another database, such as a local mongod.
  const uri = process.env.MONGODB_URI
    || `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.yyink.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();

  return { client, db: client.db('full-stack-react-db') };
}
