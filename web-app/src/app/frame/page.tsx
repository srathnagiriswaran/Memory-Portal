"use client";

import { useState, useEffect } from "react";
import { useNoSleep } from "@/hooks/useNoSleep";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { AnimatePresence, motion } from "framer-motion";
import { Power, MessageCircleHeart, Expand, Mic, Loader2 } from "lucide-react";

interface Memory {
  id: string;
  photoUrl: string;
  caretakerName: string;
  transcription: string;
}

export default function MagicFrame() {
  const { isAwake, enable } = useNoSleep();
  const { state: geminiState, error: geminiError, transcript, connect, disconnect } = useGeminiLive();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isActiveSession, setIsActiveSession] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Fetch active memories
  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const res = await fetch("/api/memories");
        const data = await res.json();
        if (data.memories && data.memories.length > 0) {
          setMemories(data.memories);
        } else {
          // Fallback ambient photos if no memories exist
          setMemories([
            { id: "1", photoUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop", caretakerName: "System", transcription: "A beautiful nature scene." },
            { id: "2", photoUrl: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=2076&auto=format&fit=crop", caretakerName: "System", transcription: "Another beautiful nature scene." }
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch memories:", err);
      }
    };
    fetchMemories();
  }, []);

  // Cycle through photos in idle mode
  useEffect(() => {
    if (isActiveSession || memories.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % memories.length);
    }, 10000); // Change photo every 10 seconds

    return () => clearInterval(interval);
  }, [isActiveSession, memories.length]);

  const requestFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error("Error attempting to enable fullscreen:", err);
      }
    }
  };

  const handleStart = async () => {
    await enable(); // Enable NoSleep
    await requestFullscreen(); // Request Fullscreen
  };

  const handleReminisce = async () => {
    setIsActiveSession(true);
    const currentMemory = memories[currentPhotoIndex];
    
    // Pass real context from Firestore
    const context = `This photo was added by ${currentMemory?.caretakerName || "a loved one"}. They left this note about it: "${currentMemory?.transcription || "It's a beautiful memory."}"`;
    
    await connect(context);
  };

  const handleEndSession = async () => {
    disconnect();
    setIsActiveSession(false);
    
    // Send the captured transcript to the Memory Harvest endpoint
    try {
      const currentMemory = memories[currentPhotoIndex];
      const finalTranscript = transcript.length > 0 
        ? transcript.join('\n') 
        : `AI: This looks like a fun day! (Simulated backup transcript)
           Patient: Yes, it was my favorite.
           AI: Oh, what did you like about it?
           Patient: We had chocolate ice cream.`;
      
      console.log("Triggering Memory Harvest with transcript length:", finalTranscript.length);
      await fetch('/api/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: finalTranscript,
          photoId: currentMemory?.id,
          caretakerName: currentMemory?.caretakerName
        })
      });
      console.log("Memory Harvest complete.");
    } catch (err) {
      console.error("Failed to harvest memory:", err);
    }
  };

  const currentPhotoUrl = memories.length > 0 ? memories[currentPhotoIndex].photoUrl : "";

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center text-white">
      {!isAwake || !isFullscreen ? (
        <div className="z-10 flex flex-col items-center gap-6 p-8 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-center max-w-md">
          <Power className="w-16 h-16 text-emerald-400" />
          <div>
            <h1 className="text-3xl font-light mb-2">Magic Frame</h1>
            <p className="text-white/60 font-light">
              Tap below to turn on the frame, keep the screen awake, and enter fullscreen mode.
            </p>
          </div>
          <button
            onClick={handleStart}
            className="w-full py-4 bg-white text-black rounded-full font-medium text-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
          >
            <Expand className="w-5 h-5" />
            Start Frame
          </button>
        </div>
      ) : (
        <>
          {/* Background Ambient Photo layer */}
          <AnimatePresence mode="wait">
            {currentPhotoUrl && (
              <motion.img
                key={currentPhotoIndex}
                src={currentPhotoUrl}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 0.6, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 }}
                className="absolute inset-0 w-full h-full object-cover"
                alt="Ambient Memory"
              />
            )}
          </AnimatePresence>

          {/* Foreground UI Layer */}
          <div className="z-10 absolute inset-0 flex flex-col p-8">
            <div className="flex-1 flex items-center justify-center">
              {isActiveSession ? (
                <div className="bg-black/40 backdrop-blur-xl p-12 rounded-3xl border border-white/20 text-center max-w-2xl animate-in fade-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                     {geminiState === 'connecting' ? (
                       <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                     ) : geminiState === 'connected' ? (
                       <div className="w-16 h-16 bg-emerald-500 rounded-full animate-pulse" />
                     ) : (
                       <Mic className="w-10 h-10 text-red-400" />
                     )}
                  </div>
                  <h2 className="text-4xl font-light mb-4">
                    {geminiState === 'connecting' ? 'Connecting...' : 
                     geminiState === 'connected' ? 'Listening...' : 
                     'Session Ended'}
                  </h2>
                  <p className="text-2xl text-white/80 font-light leading-relaxed">
                    {geminiError ? <span className="text-red-400">{geminiError}</span> :
                     `"${memories[currentPhotoIndex]?.transcription || 'Listening to your story...'}"`}
                  </p>
                  <button 
                    onClick={handleEndSession}
                    className="mt-12 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    End Session
                  </button>
                </div>
              ) : null}
            </div>

            {/* Persistent Reminisce Button for Idle Mode */}
            {!isActiveSession && memories.length > 0 && (
              <div className="flex justify-center pb-8">
                <button
                  onClick={handleReminisce}
                  className="group flex items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 px-8 py-5 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <div className="bg-emerald-500 p-3 rounded-full group-hover:bg-emerald-400 transition-colors">
                    <MessageCircleHeart className="w-8 h-8 text-black fill-black" />
                  </div>
                  <span className="text-3xl font-light tracking-wide text-white drop-shadow-md">
                    Reminisce
                  </span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
