"use client";

import { MediaItem } from "@/lib/googlePhotos";
import { Mic, Square, Play, Trash2, Send, Loader2 } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useState } from "react";

export function PhotoCard({ photo, onUploadSuccess }: { photo: MediaItem, onUploadSuccess?: () => void }) {
  const { isRecording, audioUrl, startRecording, stopRecording, clearAudio, audioBlob } = useAudioRecorder();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!audioBlob) return;
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice_note.webm");
      formData.append("photoId", photo.id);
      formData.append("photoUrl", `${photo.baseUrl}=w1024-h1024-c`);

      const res = await fetch("/api/upload-voice", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save voice note");
      }

      alert("Saved to vault! Transcription successful.");
      clearAudio();
      if (onUploadSuccess) onUploadSuccess();
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Error saving voice note: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <div className="h-48 bg-gray-200 relative">
        <img 
          src={`${photo.baseUrl}=w1024-h1024-c`} 
          alt="Pending memory" 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded">
          Google Photos
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3">
        <p className="text-sm text-gray-600">This photo needs a Voice Anchor before it can be sent to the Magic Frame.</p>
        
        {audioUrl ? (
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
                onClick={handleUpload}
                className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isUploading ? "Saving..." : "Save to Vault"}
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors ${
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
        )}
      </div>
    </div>
  );
}
