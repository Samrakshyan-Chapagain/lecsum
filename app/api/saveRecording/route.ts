// app/api/saveRecording/route.ts
import { NextResponse } from "next/server";
import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = "hackuta";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectDB() {
  if (cachedClient && cachedDb) return cachedDb.collection("recordings");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;
  return db.collection("recordings");
}

export async function POST(req: Request) {
  try {
    const collection = await connectDB();
    const { userId, email, name, audioUrl } = await req.json();

    if (!userId || !email || !name || !audioUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await collection.insertOne({
      userId,
      email,
      name,
      audioUrl,
      date: new Date(),
    });

    return NextResponse.json({ success: true, recordingId: result.insertedId }, { status: 201 });
  } catch (err: unknown) {
    let message = "An unexpected error occurred";
    if (err instanceof Error) message = err.message;

    console.error("Error saving recording:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
