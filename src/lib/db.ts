import { MongoClient } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI!;
if (!uri) throw new Error('Please define the MONGODB_URI environment variable');

let client: MongoClient;
const clientPromise: Promise<MongoClient> = global._mongoClientPromise || (() => {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
  return global._mongoClientPromise;
})();

export async function getDb() {
  const client = await clientPromise;
  return client.db();
}

// No initDb needed for MongoDB
