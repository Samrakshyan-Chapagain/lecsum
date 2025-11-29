
import { NextResponse } from "next/server";
import { Db, MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = "hackuta";

let cachedClient: MongoClient | null = null;
let cachedDb:Db|null=null;


async function connectDB() {
  if (cachedClient && cachedDb) return cachedDb.collection("recordings");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;
  return db.collection("recordings");
}

export async function GET(req: Request) {
  try {
    const collection = await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const recordings = await collection.find({ userId }).sort({ date: -1 }).toArray();
    return NextResponse.json(recordings, { status: 200 });
  } catch (err: unknown) {
    console.error("Error fetching recordings:", err);
    return NextResponse.json({ error: "Failed to fetch recordings" }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const collection = await connectDB();
    const { userId, email, name, audioUrl, date } = await req.json();

    if (!userId || !email || !name || !audioUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newRecording = await collection.insertOne({
      userId,
      email,
      name,
      audioUrl,
      date: date ? new Date(date) : new Date(),
    });

    return NextResponse.json(
      { success: true, recordingId: newRecording.insertedId },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Error saving recording:", err);
    return NextResponse.json({ error: "Failed to save recording" }, { status: 500 });
  }
}


export async function PUT(req: Request) {
  try {
    const collection = await connectDB();
    const { id, newName } = await req.json();

    if (!id || !newName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: "Invalid id format" }, { status: 400 });
    }

    const updated = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: { name: newName } },
      { returnDocument: "after" }
    );

    if (!updated?.value) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    return NextResponse.json(updated?.value, { status: 200 });
  } catch (err: unknown) {
    console.error("Error renaming recording:", err);
    return NextResponse.json({ error: "Failed to rename recording" }, { status: 500 });
  }
}



export async function DELETE(req: Request) {
  try {
    const collection = await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: "Invalid id format" }, { status: 400 });
    }

    const deleted = await collection.findOneAndDelete({ _id: objectId });

    if (!deleted?.value) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("Error deleting recording:", err);
    return NextResponse.json({ error: "Failed to delete recording" }, { status: 500 });
  }
}
