"use client";

import { Mic, Square, Trash2, Send, Loader2, Type, X } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useState } from "react";

export interface MemoryItem {
  id: string;
  photoUrl: string;
  status: string;
  transcription?: string;
  caretakerName?: string;
}

export function PhotoCard({ memory, onUploadSuccess }: { memory: MemoryItem; onUploadSuccess?: () => void }) {
  const { isRecording, audioUrl, startRecording, stopRecording, clearAudio, audioBlob } = useAudioRecorder();
  const [isUploading, setIsUploading] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [textNote, setTextNote] = useState("");

  const handleAudioUpload = async () => {
    if (!audioBlob) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice_note.webm");
      formData.append("memoryId", memory.id);

      const res = await fetch("/api/upload-voice", { method: "POST", body: formData });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save voice note");
      }

      clearAudio();
      onUploadSuccess?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Error saving voice note: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextUpload = async () => {
    if (!textNote.trim()) return;
    setIsUploading(true);

    try {
      const res = await fetch("/api/upload-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoryId: memory.id, transcription: textNote.trim() })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save text note");
      }

      setTextNote("");
      setIsTextMode(false);
      onUploadSuccess?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Error saving text note: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl shadow-sm border border-white rounded-3xl overflow-hidden flex flex-col">
      <div className="h-48 bg-gray-200 relative">
        <img src={memory.photoUrl} alt="Pending memory" className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded">
          Needs Context
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3">
        <p className="text-sm text-gray-600">Provide a story or context for this photo before it goes to the Magic Frame.</p>

        {isTextMode ? (
          <div className="flex flex-col gap-2">
            <textarea
              className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              rows={3}
              placeholder="Type your memory context here..."
              value={textNote}
              onChange={(e) => setTextNote(e.target.value)}
              disabled={isUploading}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsTextMode(false)}
                className="flex-1 bg-gray-100 text-gray-600 hover:bg-gray-200 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                disabled={isUploading}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleTextUpload}
                className="flex-1 bg-gray-900 text-white hover:bg-gray-800 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                disabled={isUploading || !textNote.trim()}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isUploading ? "Saving..." : "Save to Vault"}
              </button>
            </div>
          </div>
        ) : audioUrl ? (
          <div className="flex flex-col gap-2">
            <audio src={audioUrl} controls className="w-full h-10" />
            <div className="flex gap-2">
              <button
                onClick={clearAudio}
                className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                disabled={isUploading}
              >
                <Trash2 className="w-4 h-4" />
                Retake
              </button>
              <button
                onClick={handleAudioUpload}
                className="flex-1 bg-gray-900 text-white hover:bg-gray-800 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isUploading ? "Saving..." : "Save to Vault"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                isRecording
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Record Voice Note
                </>
              )}
            </button>
            {!isRecording && (
              <button
                onClick={() => setIsTextMode(true)}
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Type className="w-4 h-4" />
                Type Instead
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
