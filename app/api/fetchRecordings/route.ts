
import { NextResponse } from "next/server";
import { MongoClient, ObjectId, Collection } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = "hackuta";

let cachedClient: MongoClient | null = null;
let cachedCollection: Collection | null = null;

async function getCollection(): Promise<Collection> {
  if (cachedCollection) return cachedCollection;

  const client = cachedClient ?? new MongoClient(uri);
  if (!cachedClient) await client.connect();

  cachedClient = client;
  cachedCollection = client.db(dbName).collection("recordings");

  return cachedCollection;
}

export async function GET(req: Request) {
  try {
    const collection = await getCollection();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const recordings = await collection.find({ userId }).sort({ date: -1 }).toArray();
    return NextResponse.json(recordings);
  } catch (err: unknown) {
    console.error("Fetch recordings error:", err);
    return NextResponse.json({ error: "Failed to fetch recordings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const collection = await getCollection();
    const { userId, email, name, audioUrl, date } = await req.json();

    if (!userId || !email || !name || !audioUrl)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const result = await collection.insertOne({
      userId,
      email,
      name,
      audioUrl,
      date: date ? new Date(date) : new Date(),
    });

    return NextResponse.json({ success: true, recordingId: result.insertedId }, { status: 201 });
  } catch (err: unknown) {
    console.error("Save recording error:", err);
    return NextResponse.json({ error: "Failed to save recording" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const collection = await getCollection();
    const { id, newName } = await req.json();

    if (!id || !newName)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const updated = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name: newName } },
      { returnDocument: "after" }
    );

    if (!updated?.value) return NextResponse.json({ error: "Recording not found" }, { status: 404 });

    return NextResponse.json(updated.value);
  } catch (err: unknown) {
    console.error("Rename recording error:", err);
    return NextResponse.json({ error: "Failed to rename recording" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const collection = await getCollection();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const deleted = await collection.findOneAndDelete({ _id: new ObjectId(id) });
    if (!deleted?.value) return NextResponse.json({ error: "Recording not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Delete recording error:", err);
    return NextResponse.json({ error: "Failed to delete recording" }, { status: 500 });
  }
}
