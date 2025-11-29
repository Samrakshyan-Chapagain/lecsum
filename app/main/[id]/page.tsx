"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import Recorder from "@/components/Recorder";
import AudioList from "@/components/AudioList";
import AudioDetails from "@/components/AudioDetails";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { Recording } from "@/types/Recording";

export default function MainPage() {
  const { user, isLoaded } = useUser();

  const [loading, setLoading] = useState(true);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<Recording | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [isSummarizing, setIsSummarizing] = useState(false);


  const fetchRecordings = useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch(`/api/recordings?userId=${user.id}`);
      const data: Recording[] = await res.json();

      if (Array.isArray(data)) setRecordings(data);
    } catch (err: unknown) {
      console.error("Error fetching recordings:", err);
    }
  }, [user]);

  useEffect(() => {
    if (isLoaded) {
      fetchRecordings();
      const timeout = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [isLoaded, fetchRecordings]);


  const handleNewRecording = (newRecording: Recording) => {
    setRecordings((prev) => [newRecording, ...prev]);
    setSelectedAudio(newRecording);
    setSummary("");
  };


  const handleSummarize = async () => {
    if (!selectedAudio) return;

    setIsSummarizing(true);
    setSummary("");

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl: selectedAudio.audioUrl }),
      });

      const data: { summary?: string; error?: string } = await res.json();

      if (data.error) throw new Error(data.error);

      setSummary(data.summary ?? "No summary generated.");
    } catch (err: unknown) {
      console.error("Error summarizing:", err);
      setSummary("Failed to summarize audio.");
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!isLoaded || loading) return <LoadingScreen />;
  if (!user) return <p>Please sign in to continue.</p>;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-pink-50 to-purple-50 shadow-inner overflow-hidden">

      <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 p-4 md:p-6 flex flex-col gap-6 bg-white/70 backdrop-blur-md shadow-lg overflow-y-auto md:h-full">

        <div className="flex justify-between items-center mb-2 md:mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Your Recordings</h2>
          <UserButton />
        </div>


        <Recorder
          userId={user.id}
          email={user.emailAddresses[0]?.emailAddress ?? ""}
          onSaved={handleNewRecording}
        />


        <AudioList
          userId={user.id}
          recordings={recordings}
          setRecordings={setRecordings}
          onSelectAudio={(audio) => {
            setSelectedAudio(audio);
            setSummary("");
          }}
        />
      </div>


      <div className="w-full md:w-2/3 p-4 md:p-8 overflow-y-auto space-y-6 flex-1">
        {selectedAudio ? (
          <>
            <AudioDetails audio={selectedAudio} />

            <div className="bg-white/70 rounded-2xl p-4 md:p-6 shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h3 className="text-lg md:text-xl font-semibold text-gray-800">
                  Lecture Summary
                </h3>
                <Button
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 w-full sm:w-auto"
                >
                  {isSummarizing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Summarizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Summarize
                    </>
                  )}
                </Button>
              </div>

              {summary ? (
                <div className="bg-white border rounded-xl p-4 shadow-sm">
                  <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  Click &quot;Summarize&quot; to generate a summary for this recording.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-lg text-center">
            <p className="text-2xl md:text-3xl font-bold mb-4">Select a lecture</p>
            <p className="text-gray-500 px-4">
              or tap &quot;Start Recording&quot; to add a new one
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-gradient-to-br from-pink-100 to-purple-100">
      <div className="text-center animate-pulse">
        <div className="inline-block w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-700 text-lg font-semibold">Loading...</p>
      </div>
    </div>
  );
}
