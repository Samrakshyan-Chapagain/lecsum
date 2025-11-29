"use client";

import { useState } from "react";
import { Recording } from "@/types/Recording";

type AudioDetailsProps = {
  audio: Recording;
  onSummaryUpdate?: (summary: string) => void;
};

export default function AudioDetails({ audio, onSummaryUpdate }: AudioDetailsProps) {
  const [summary, setSummary] = useState<string>(audio?.summary || "");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSummarize = async () => {
    setLoading(true);
    setSummary(""); 
    try {
      const res = await fetch("/api/summarizeAudio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioId: audio._id }),
      });

      const data: { summary?: string; error?: string } = await res.json();

      if (data.error) throw new Error(data.error);

      setSummary(data.summary ?? "No summary generated.");
      if (onSummaryUpdate) onSummaryUpdate(data.summary ?? "");
    } catch (err: unknown) {
      console.error("Error summarizing:", err);
      setSummary("Failed to generate summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 flex flex-col gap-4 sm:gap-5 md:gap-6 transition-all w-full max-w-[700px] mx-auto">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center sm:text-left break-words">
        {audio.name || "Unnamed Lecture"}
      </h2>

      <div className="text-gray-700 space-y-1 text-sm sm:text-base">
        <p>
          <strong>Date:</strong>{" "}
          {audio.date ? new Date(audio.date).toLocaleString() : "No date"}
        </p>
        <p>
          <strong>Email:</strong> {audio.email || "No email"}
        </p>
      </div>

      {audio.audioUrl ? (
        <audio
          controls
          src={audio.audioUrl}
          className="mt-3 sm:mt-4 w-full rounded-xl shadow-inner"
        />
      ) : (
        <p className="text-red-500 text-center sm:text-left">Audio URL not found.</p>
      )}



      {summary && (
        <div className="mt-4 p-3 sm:p-4 bg-white rounded-lg shadow-inner text-sm sm:text-base">
          <p className="whitespace-pre-wrap break-words">{summary}</p>
        </div>
      )}
    </div>
  );
}
