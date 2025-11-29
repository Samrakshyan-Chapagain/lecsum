"use client";

import { Recording } from "@/types/Recording";
import { useState, useEffect } from "react";

type AudioItemProps = {
  recordingId: string;
  recordings: Recording[];
};

export default function AudioItem({ recordingId, recordings }: AudioItemProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [recording, setRecording] = useState<Recording | null>(null);

  useEffect(() => {
    const rec = recordings.find((r) => r._id === recordingId) || null;
    setRecording(rec);
  }, [recordings, recordingId]);

  if (!recording) return null;

  const handleSummarize = async () => {
    setLoading(true);
    setSummary(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl: recording.audioUrl }),
      });
      const data = await res.json();
      setSummary(data.summary || "No summary generated.");
    } catch (err) {
      console.error(err);
      setSummary("Failed to summarize. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 sm:p-5 md:p-6 rounded shadow-sm w-full max-w-[700px] mx-auto bg-white/80 backdrop-blur-md transition-all">
      <p className="text-base sm:text-lg font-semibold text-gray-900 break-words text-center sm:text-left">
        {recording.name || "Unnamed Recording"}
      </p>
      <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
        {recording.date ? new Date(recording.date).toLocaleString() : "No date"}
      </p>

      {recording.audioUrl ? (
        <audio
          controls
          src={recording.audioUrl}
          className="w-full mt-3 sm:mt-4 rounded-lg shadow-inner"
        />
      ) : (
        <p className="text-red-500 text-center mt-2">Audio URL not found.</p>
      )}

      <button
        onClick={handleSummarize}
        disabled={loading}
        className="mt-4 px-4 py-2 sm:px-5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm sm:text-base disabled:opacity-70 w-full sm:w-auto"
      >
        {loading ? "Summarizing..." : "Summarize"}
      </button>

      {summary && (
        <p className="mt-3 sm:mt-4 text-gray-700 text-sm sm:text-base whitespace-pre-wrap break-words">
          {summary}
        </p>
      )}
    </div>
  );
}
