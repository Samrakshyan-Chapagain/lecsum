// lib/mongodb.ts
import { MongoClient, Db, Collection } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = "hackuta";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectDB(): Promise<{
  client: MongoClient;
  db: Db;
  recordings: Collection;
}> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb, recordings: cachedDb.collection("recordings") };
  }

  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db, recordings: db.collection("recordings") };
}
