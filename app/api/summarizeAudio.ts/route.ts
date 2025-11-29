import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { audioUrl } = await req.json();
    if (!audioUrl) {
      return NextResponse.json({ error: "Missing audioUrl" }, { status: 400 });
    }


    const res = await fetch(audioUrl);
    if (!res.ok) throw new Error("Failed to fetch audio from Supabase");
    const arrayBuffer = await res.arrayBuffer();
    const audioData = Buffer.from(arrayBuffer);


    const contents = [
      { text: "Summarize the following audio content.", role: "user" }, 
      {
        inlineData: {
          mimeType: "audio/webm", 
          data: audioData.toString("base64"),
        },
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });


    const summary = response.text ?? "";

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (err: unknown) {
    let message = "An unexpected error occurred";
    if (err instanceof Error) message = err.message;

    console.error("Error summarizing audio:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
