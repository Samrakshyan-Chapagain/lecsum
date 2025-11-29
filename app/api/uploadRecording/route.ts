// app/api/uploadRecording/route.ts

import { MongoClient } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // ensure server runtime on Vercel

// --- Debug: Show environment readiness ---
console.log("🔧 DEBUG: API route initialized");
console.log("🔧 DEBUG: SUPABASE_URL:", process.env.SUPABASE_URL ? "OK" : "❌ MISSING");
console.log("🔧 DEBUG: SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "OK" : "❌ MISSING");
console.log("🔧 DEBUG: MONGODB_URI:", process.env.MONGODB_URI ? "OK" : "❌ MISSING");

// --- MongoDB Setup ---
const uri = process.env.MONGODB_URI!;
let cachedClient: MongoClient | null = null;

async function getClient() {
  if (cachedClient) return cachedClient;

  console.log("🔧 DEBUG: Connecting to MongoDB…");

  cachedClient = new MongoClient(uri);
  await cachedClient.connect();

  console.log("✅ DEBUG: MongoDB connected");

  return cachedClient;
}

// --- Supabase Server Client ---
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    console.log("🔧 DEBUG: POST /api/uploadRecording request received");

    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;
    const email = formData.get("email") as string | null;
    const name = formData.get("name") as string | null;

    console.log("🔧 DEBUG: Form Data:", { hasFile: !!file, userId, email, name });


    if (!file || !userId || !name) {
      console.log(" DEBUG: Missing fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }


    console.log(" DEBUG: Reading file buffer…");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    console.log("🔧 DEBUG: Uploading file:", fileName);


    const { error: uploadError, data: uploadData } = await supabase.storage
      .from("recordings")
      .upload(fileName, buffer, {
        contentType: file.type || "audio/webm",
      });

    if (uploadError) {
      console.error("Supabase Upload Error:", uploadError);
      throw uploadError;
    }

    console.log("DEBUG: Supabase upload success:", uploadData);


    const { data: publicUrlData } = supabase.storage
      .from("recordings")
      .getPublicUrl(fileName);

    console.log("DEBUG: Public URL response:", publicUrlData);

    const audioUrl = publicUrlData?.publicUrl;
    if (!audioUrl) throw new Error("Failed to generate Supabase public URL");

    // --- Save metadata into MongoDB ---
    const client = await getClient();
    const db = client.db("hackuta");
    const collection = db.collection("recordings");

    console.log("🔧 DEBUG: Inserting into MongoDB…");

    const result = await collection.insertOne({
      userId,
      email,
      name,
      audioUrl,
      createdAt: new Date(),
    });

    console.log("DEBUG: Mongo insert success:", result.insertedId);

    return NextResponse.json({
      success: true,
      audioUrl,
      recordingId: result.insertedId,
    });

  } catch (err: unknown) {
  console.error(" FULL ERROR STACK:");
  
  if (err instanceof Error) {
    console.error(err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }


  console.error(err);
  return NextResponse.json(
    { success: false, error: "Unexpected server error" },
    { status: 500 }
  );
}

}
