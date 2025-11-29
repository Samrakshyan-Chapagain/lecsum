"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Recording } from "@/types/Recording";

type AudioListProps = {
  userId: string; 
  recordings?: Recording[];
  setRecordings: React.Dispatch<React.SetStateAction<Recording[]>>;
  onSelectAudio: (audio: Recording) => void;
};

type ModalState = {
  visible: boolean;
  action: "delete" | "rename" | null;
  recordingId?: string;
  newName?: string;
};

export default function AudioList({
  userId,
  recordings = [],
  setRecordings,
  onSelectAudio,
}: AudioListProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>({
    visible: false,
    action: null,
  });

  const fetchRecordings = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/recordings?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch recordings");
      const data: Recording[] = await res.json();
      setRecordings(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!userId) return; 
    fetchRecordings();

  }, [userId]);


  const openModal = (action: "delete" | "rename", recordingId: string, newName?: string) => {
    setModal({ visible: true, action, recordingId, newName });
  };

  const confirmModal = async () => {
    if (!modal.recordingId) return;

    try {
      if (modal.action === "delete") {
        setRecordings((prev) => prev.filter((r) => r._id !== modal.recordingId));
        const res = await fetch(`/api/recordings?id=${modal.recordingId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Delete failed");
      }

      if (modal.action === "rename" && modal.newName) {
        setRecordings((prev) =>
          prev.map((r) =>
            r._id === modal.recordingId ? { ...r, name: modal.newName! } : r
          )
        );
        const res = await fetch("/api/recordings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: modal.recordingId, newName: modal.newName }),
        });
        if (!res.ok) throw new Error("Rename failed");
      }

 
      await fetchRecordings();
    } catch (err) {
      console.error(err);
    } finally {
      setModal({ visible: false, action: null });
      setRenamingId(null);
      setNewName("");
      setIsMenuOpen(false);
    }
  };

  const cancelModal = () => {
    setModal({ visible: false, action: null });
  };

  /** Render recording item */
  const RecordingItem = (rec: Recording, isMobile: boolean, index: number) => (
    <div
      key={rec._id ?? `${rec.name}-${index}`}
      className="flex justify-between items-center p-4 bg-white rounded-xl shadow hover:bg-gray-50 w-full"
    >

      <div
        className="flex flex-col cursor-pointer min-w-0"
        onClick={() => {
          if (renamingId !== rec._id) onSelectAudio(rec);
          if (isMobile) setIsMenuOpen(false);
        }}
      >
        {renamingId === rec._id ? (
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border p-1 rounded text-sm w-full"
            placeholder="New name"
            autoFocus
          />
        ) : (
          <>
            <p className="font-semibold truncate">{rec.name || "Unnamed Lecture"}</p>
            <p className="text-sm text-gray-500">
              {rec.date ? new Date(rec.date).toLocaleString() : "No date"}
            </p>
            <p className="text-sm text-gray-400 truncate">{rec.email || "No email"}</p>
          </>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 flex-shrink-0 ml-3">
        {renamingId === rec._id ? (
          <button
            onClick={() => openModal("rename", rec._id!, newName)}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg shadow text-sm"
          >
            Save
          </button>
        ) : (
          <button
            onClick={() => {
              setRenamingId(rec._id!);
              setNewName(rec.name || "");
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg shadow text-sm"
          >
            Rename
          </button>
        )}

        <button
          onClick={() => openModal("delete", rec._id!)}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg shadow text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  );

  if (recordings.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 w-full">
        <p className="text-gray-500 text-lg">No recordings yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full relative">

      <div className="flex items-center justify-between md:hidden mb-3">
        <h2 className="text-lg font-semibold">Your Recordings</h2>
        <button
          onClick={() => setIsMenuOpen((v) => !v)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      </div>

 
      {isMenuOpen && (
        <div className="flex flex-col gap-3 bg-white p-4 rounded-xl shadow-md md:hidden mb-4">
          {recordings.map((rec, i) => RecordingItem(rec, true, i))}
        </div>
      )}

      <div className="hidden md:flex flex-col gap-4 w-full">
        {recordings.map((rec, i) => RecordingItem(rec, false, i))}
      </div>


      {modal.visible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 text-center shadow-lg">
            <p className="text-lg font-semibold mb-4">
              {modal.action === "delete"
                ? "Are you sure you want to delete this recording?"
                : "Are you sure you want to rename this recording?"}
            </p>
            <div className="flex justify-around mt-4">
              <button
                onClick={confirmModal}
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg shadow"
              >
                Sure
              </button>
              <button
                onClick={cancelModal}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg shadow"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
