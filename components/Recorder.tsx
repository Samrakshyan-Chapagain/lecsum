"use client";

import { Recording } from "@/types/Recording";
import { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

type RecorderProps = {
  userId: string;
  email: string;
  onSaved: (newRecording: Recording) => void; 
};

export default function Recorder({ userId, email, onSaved }: RecorderProps) {
  const [recording, setRecording] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempBlob, setTempBlob] = useState<Blob | null>(null);
  const [lectureName, setLectureName] = useState("");
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      setTempBlob(blob);
      setShowNameModal(true);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleSaveLecture = async () => {
    if (!tempBlob || !lectureName.trim()) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("email", email);
    formData.append("name", lectureName.trim());
    formData.append("file", tempBlob, `${uuidv4()}.webm`);

    try {
      const res = await fetch("/api/uploadRecording", { method: "POST", body: formData });
      const savedRecording = await res.json();

  
      const sanitized = {
        _id: savedRecording._id || uuidv4(),
        userId,
        name: savedRecording.name || lectureName || "Unnamed Lecture",
        date: savedRecording.date ? new Date(savedRecording.date).toISOString() : new Date().toISOString(),
        email: savedRecording.email || email || "No email",
        audioUrl: savedRecording.audioUrl || "",
      };

      onSaved(sanitized);
    } catch (err) {
      console.error("Save failed:", err);
    }

    setUploading(false);
    setShowNameModal(false);
    setLectureName("");
    setTempBlob(null);
  };

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex gap-2">
        <button
          onClick={startRecording}
          disabled={recording || uploading}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            recording || uploading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-pink-500 text-white hover:bg-pink-600"
          }`}
        >
          Start Recording
        </button>
        <button
          onClick={stopRecording}
          disabled={!recording}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:bg-gray-300 disabled:text-gray-500"
        >
          Stop Recording
        </button>
      </div>

      {showNameModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-6 flex flex-col gap-4 w-80">
            <h2 className="text-xl font-bold text-gray-900 text-center">Name Your Lecture</h2>
            <input
              type="text"
              placeholder="Lecture name..."
              value={lectureName}
              onChange={(e) => setLectureName(e.target.value)}
              className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button
              onClick={handleSaveLecture}
              disabled={!lectureName.trim() || uploading}
              className={`py-2 rounded-lg font-semibold transition ${
                lectureName.trim() && !uploading
                  ? "bg-pink-500 hover:bg-pink-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {uploading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
