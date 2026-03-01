"use client";

import { useState, useEffect, useCallback } from "react";
import { useNoSleep } from "@/hooks/useNoSleep";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { AnimatePresence, motion } from "framer-motion";
import { Power, MessageCircleHeart, Expand, Mic, MicOff, Loader2 } from "lucide-react";

interface Memory {
  id: string;
  photoUrl: string;
  caretakerName: string;
  transcription: string;
  learnedFacts?: string[];
}

// Mock Family Knowledge Graph for the hackathon WOW factor
const FAMILY_KNOWLEDGE_GRAPH = `
FAMILY KNOWLEDGE GRAPH:
- User's Name: Grandpa John
- Primary Caregiver (Daughter): Sarah
- Grandson: Mark (Sarah's son)
- Late Wife: Mary
- Pets: A golden retriever named Buster (from the 90s)
- Hobbies: Used to love gardening and restoring old cars.
`;

export default function MagicFrame() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isActiveSession, setIsActiveSession] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [familyGraphText, setFamilyGraphText] = useState("");
  const [patientName, setPatientName] = useState("");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const onChangePhoto = useCallback((theme: string) => {
    console.log("🔥 AI TRIGGERED TOOL: changePhoto for theme:", theme);
    // Simple search: find first memory where transcription, caretakerName, or learnedFacts includes the theme
    const lowerTheme = theme.toLowerCase();
    const index = memories.findIndex(m => 
      m.transcription.toLowerCase().includes(lowerTheme) || 
      m.caretakerName.toLowerCase().includes(lowerTheme) ||
      m.learnedFacts?.some(f => f.toLowerCase().includes(lowerTheme))
    );
    
    if (index !== -1) {
      setCurrentPhotoIndex(index);
      const mem = memories[index];
      const facts = mem.learnedFacts && mem.learnedFacts.length > 0 ? ` Learned facts: ${mem.learnedFacts.join(', ')}.` : '';
      return `Success! I have changed the photo to a new one. Background info: This was added by ${mem.caretakerName}. Note: "${mem.transcription}".${facts} Please comment on this new photo.`;
    } else {
      // Pick a random one to simulate it if not found exactly
      const randomIdx = Math.floor(Math.random() * memories.length);
      setCurrentPhotoIndex(randomIdx);
      const mem = memories[randomIdx];
      const facts = mem.learnedFacts && mem.learnedFacts.length > 0 ? ` Learned facts: ${mem.learnedFacts.join(', ')}.` : '';
      return `I could not find an exact match for "${theme}", so I showed a different random memory instead. Background info: Added by ${mem.caretakerName}. Note: "${mem.transcription}".${facts} Please comment on this photo instead.`;
    }
  }, [memories]);

  const { isAwake, enable } = useNoSleep();
  const { state: geminiState, error: geminiError, transcript, connect, disconnect, isAiTalking, volume, isMuted, toggleMute } = useGeminiLive({ onChangePhoto });

  // Fetch active memories and family graph
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [memRes, familyRes, patientRes] = await Promise.all([
          fetch("/api/memories"),
          fetch("/api/family-graph"),
          fetch("/api/patient")
        ]);
        
        const data = await memRes.json();
        if (data.memories && data.memories.length > 0) {
          setMemories(data.memories);
        } else {
          // Fallback ambient photos if no memories exist
          setMemories([
            { id: "1", photoUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop", caretakerName: "System", transcription: "A beautiful nature scene." },
            { id: "2", photoUrl: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=2076&auto=format&fit=crop", caretakerName: "System", transcription: "Another beautiful nature scene." }
          ]);
        }

        const familyData = await familyRes.json();
        if (familyData.members && familyData.members.length > 0) {
          const graphText = familyData.members.map((m: any) => `- ${m.name} (${m.relationship}): ${m.details || 'No additional details'}`).join('\n');
          setFamilyGraphText(`FAMILY KNOWLEDGE GRAPH:\n${graphText}`);
        } else {
          setFamilyGraphText(FAMILY_KNOWLEDGE_GRAPH); // Fallback to mock
        }
        
        const patientData = await patientRes.json();
        setPatientName(patientData.name || "");
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
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
    
    // Pass real context from Firestore + Mock Knowledge Graph
    const facts = currentMemory?.learnedFacts && currentMemory.learnedFacts.length > 0 
      ? ` Things we learned in past conversations about this photo: ${currentMemory.learnedFacts.join('. ')}.` 
      : '';
      
    const context = `
      ${patientName ? `You are talking to: ${patientName}` : ''}
      ${familyGraphText}
      
      This photo was added by ${currentMemory?.caretakerName || "a loved one"}. They left this note about it: "${currentMemory?.transcription || "It's a beautiful memory."}"${facts}
    `.trim();
    
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
          <div className="z-10 absolute inset-0 flex flex-col justify-end p-8 pointer-events-none">
            <AnimatePresence>
              {isActiveSession && (
                <motion.div 
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="w-full max-w-3xl mx-auto pointer-events-auto pb-4"
                >
                  <div className="bg-black/40 backdrop-blur-xl p-4 md:p-6 rounded-3xl border border-white/20 shadow-2xl flex flex-col md:flex-row items-center gap-4 md:gap-6">
                    {/* Left: Dynamic Mic / Status Indicator */}
                    <button 
                      onClick={toggleMute}
                      className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 flex items-center justify-center focus:outline-none"
                    >
                      {geminiState === 'connecting' ? (
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                          <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-emerald-400 animate-spin" />
                        </div>
                      ) : geminiState === 'connected' ? (
                        <>
                          {!isMuted && isAiTalking && (
                            <div className="absolute inset-0 bg-emerald-500/40 rounded-full animate-ping" />
                          )}
                          {!isMuted && !isAiTalking && (
                            <div 
                              className="absolute bg-emerald-500/30 rounded-full transition-all duration-200 ease-out"
                              style={{ 
                                width: `${100 + Math.min(volume * 500, 100)}%`,
                                height: `${100 + Math.min(volume * 500, 100)}%`
                              }} 
                            />
                          )}
                          <div className={`relative w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center z-10 transition-colors shadow-lg ${isMuted ? 'bg-red-500/20' : (isAiTalking ? 'bg-emerald-400' : 'bg-emerald-600')}`}>
                            {isMuted ? (
                              <MicOff className="w-6 h-6 md:w-8 md:h-8 text-red-400" />
                            ) : (
                              <Mic className={`w-6 h-6 md:w-8 md:h-8 text-white ${isAiTalking ? 'opacity-80' : 'opacity-100'}`} />
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                          <MicOff className="w-6 h-6 md:w-8 md:h-8 text-red-400" />
                        </div>
                      )}
                    </button>

                    {/* Middle: Transcript & Status Text */}
                    <div className="flex-1 min-w-0 text-center md:text-left">
                      <p className={`text-xs md:text-sm font-medium uppercase tracking-widest mb-1 ${isMuted ? 'text-red-400' : 'text-emerald-400'}`}>
                        {geminiState === 'connecting' ? 'Connecting...' : 
                         geminiState === 'connected' ? (
                           isMuted ? 'Muted' : (isAiTalking ? 'AI Speaking' : 'Listening...')
                         ) : 'Session Ended'}
                      </p>
                      <div className="text-lg md:text-xl text-white/90 font-light leading-snug line-clamp-2">
                        {geminiError ? (
                          <span className="text-red-400">{geminiError}</span>
                        ) : transcript.length > 0 ? (
                          <span className={transcript[transcript.length - 1].startsWith("AI:") ? "text-white" : "text-white/60"}>
                            {transcript[transcript.length - 1].replace("AI: ", "")}
                          </span>
                        ) : geminiState === "connected" ? (
                          <span className="animate-pulse text-white/40">Waiting for response...</span>
                        ) : (
                          <span className="text-white/40">Getting ready...</span>
                        )}
                      </div>
                    </div>

                    {/* Right: End Session Button */}
                    <button 
                      onClick={handleEndSession}
                      className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-white/10 hover:bg-red-500/20 hover:text-red-400 rounded-full flex items-center justify-center transition-colors text-white/60 border border-white/10 mt-2 md:mt-0"
                      title="End Session"
                    >
                      <Power className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Persistent Reminisce Button for Idle Mode */}
            {!isActiveSession && memories.length > 0 && (
              <div className="flex justify-center pb-8 pointer-events-auto">
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
