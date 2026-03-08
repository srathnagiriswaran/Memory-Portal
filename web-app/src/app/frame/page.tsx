"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useNoSleep } from "@/hooks/useNoSleep";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { AnimatePresence, motion } from "framer-motion";
import { Power, MessageCircleHeart, Expand, Mic, MicOff, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface Memory {
  id: string;
  photoUrl: string;
  caretakerName: string;
  transcription: string;
  learnedFacts?: string[];
}

// Pre-loaded Family Knowledge Graph context
const FAMILY_KNOWLEDGE_GRAPH = `
FAMILY KNOWLEDGE GRAPH:
- No family members have been added yet. Please invite family to add their details in the Caretaker Studio.
`;

function MagicFrameContent() {
  const searchParams = useSearchParams();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isActiveSession, setIsActiveSession] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [familyGraphText, setFamilyGraphText] = useState("");
  const [patientName, setPatientName] = useState("");
  const [photoCatalogText, setPhotoCatalogText] = useState("");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Initialize the device token on load
  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      localStorage.setItem("frame_token", tokenFromUrl);
      setDeviceToken(tokenFromUrl);
      // Clean up the URL so the token isn't visible to anyone looking over their shoulder
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const storedToken = localStorage.getItem("frame_token");
      if (storedToken) {
        setDeviceToken(storedToken);
      } else {
        // Redirect to studio if no token found
        setIsRedirecting(true);
        window.location.href = "/studio?setup=true";
      }
    }
  }, [searchParams]);

  const onChangePhoto = useCallback((photoId: string) => {

    console.log("🔥 AI TRIGGERED TOOL: changePhoto for ID:", photoId);
    
    // Sanitize photoId just in case the model includes brackets or spaces
    const cleanPhotoId = photoId.replace(/\[|\]/g, '').trim();
    const index = memories.findIndex(m => m.id === cleanPhotoId);
    
    if (index !== -1) {
      setCurrentPhotoIndex(index);
      const mem = memories[index];
      const facts = mem.learnedFacts && mem.learnedFacts.length > 0 ? ` Learned facts: ${mem.learnedFacts.join(', ')}.` : '';
      return `Success! I have changed the photo to the requested one. Background info: This was added by ${mem.caretakerName}. Note: "${mem.transcription}".${facts} Please warmly comment on this new photo now.`;
    } else {
      return `Failed to find photo with ID ${cleanPhotoId}. Please try a different ID from the catalog, or continue the conversation without changing the photo.`;
    }
  }, [memories]);

  const { isAwake, enable } = useNoSleep();
  const { state: geminiState, error: geminiError, transcript, connect, disconnect, isAiTalking, hasSpoken, volume, isMuted, toggleMute } = useGeminiLive({ 
    onChangePhoto,
    onEndSession: () => handleEndSession()
  });

  // Fetch active memories and family graph
  useEffect(() => {
    if (!deviceToken && typeof window !== 'undefined' && !localStorage.getItem("frame_token")) {
      // Don't fetch if there's no token and we're not waiting for one from the URL
      return;
    }

    const headers = {
      'Authorization': `Bearer ${deviceToken || localStorage.getItem("frame_token")}`
    };

    const fetchData = async () => {
      try {
        const [memRes, familyRes, patientRes] = await Promise.all([
          fetch("/api/memories", { headers }),
          fetch("/api/family-graph", { headers }),
          fetch("/api/patient", { headers })
        ]);
        
        if (memRes.status === 401) {
          console.error("Unauthorized: Invalid device token");
          // Clear token and redirect to studio for setup
          localStorage.removeItem("frame_token");
          setIsRedirecting(true);
          window.location.href = "/studio?setup=true";
          return;
        }

        const demoNamesBase64 = searchParams.get("demo_names");
        let overrides: Record<string, string> | null = null;
        if (demoNamesBase64) {
          try {
            overrides = JSON.parse(decodeURIComponent(atob(demoNamesBase64)));
          } catch (e) {
            console.error("Failed to parse demo overrides", e);
          }
        }

        const BASE_NAMES = {
          patient: "Thomas",
          spouse: "Martha",
          caregiver: "David",
          daughter: "Sarah",
          grandson: "Jake",
          granddaughter: "Emily",
          dog: "Buster"
        };

        const personalize = (text: string) => {
          if (!overrides || !text) return text;
          let result = text;
          // Order matters: swap full names before partial ones to avoid partial collisions
          if (overrides.granddaughter) result = result.replaceAll(BASE_NAMES.granddaughter, overrides.granddaughter);
          if (overrides.grandson) result = result.replaceAll(BASE_NAMES.grandson, overrides.grandson);
          if (overrides.daughter) result = result.replaceAll(BASE_NAMES.daughter, overrides.daughter);
          if (overrides.caregiver) result = result.replaceAll(BASE_NAMES.caregiver, overrides.caregiver);
          if (overrides.spouse) result = result.replaceAll(BASE_NAMES.spouse, overrides.spouse);
          if (overrides.patient) result = result.replaceAll(BASE_NAMES.patient, overrides.patient);
          if (overrides.dog) result = result.replaceAll(BASE_NAMES.dog, overrides.dog);
          return result;
        };

        const data = await memRes.json();
        if (data.memories && data.memories.length > 0) {
          const personalizedMemories = data.memories.map((m: any) => ({
            ...m,
            caretakerName: personalize(m.caretakerName),
            transcription: personalize(m.transcription),
            learnedFacts: m.learnedFacts ? m.learnedFacts.map(personalize) : []
          }));

          setMemories(personalizedMemories);

          // Find the newest unshown photo
          const viewedIds = JSON.parse(localStorage.getItem("viewed_memories") || "[]");
          const unshownIndex = personalizedMemories.findIndex((m: any) => !viewedIds.includes(m.id));
          
          let initialIndex = 0;
          if (unshownIndex !== -1) {
            initialIndex = unshownIndex;
          } else {
            // Fallback to random if all have been seen
            initialIndex = Math.floor(Math.random() * personalizedMemories.length);
          }
          
          setCurrentPhotoIndex(initialIndex);
          
          // Mark this initial photo as viewed
          if (!viewedIds.includes(personalizedMemories[initialIndex].id)) {
            localStorage.setItem("viewed_memories", JSON.stringify([...viewedIds, personalizedMemories[initialIndex].id]));
          }
          
          const catalog = personalizedMemories.map((m: any) => `[ID: ${m.id}] - Added by: ${m.caretakerName}. Context: "${m.transcription}". ${m.learnedFacts && m.learnedFacts.length > 0 ? `Learned facts: ${m.learnedFacts.join(', ')}` : ''}`).join('\n');
          setPhotoCatalogText(`AVAILABLE PHOTO ALBUM CATALOG:\n${catalog}`);
        } else {
          // No memories exist for this token, so it's essentially an unconfigured or empty frame.
          // Redirect to the studio so they can upload photos or log in properly.
          setIsRedirecting(true);
          window.location.href = "/studio?setup=true";
          return;
        }

        const familyData = await familyRes.json();
        if (familyData.members && familyData.members.length > 0) {
          const graphText = familyData.members.map((m: any) => `- ${personalize(m.name)} (${m.relationship}): ${personalize(m.details || 'No additional details')}`).join('\n');
          setFamilyGraphText(`FAMILY KNOWLEDGE GRAPH:\n${graphText}`);
        } else {
          setFamilyGraphText(FAMILY_KNOWLEDGE_GRAPH); // Fallback to mock
        }
        
        const patientData = await patientRes.json();
        setPatientName(personalize(patientData.name || ""));
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
      setCurrentPhotoIndex((prev) => {
        const viewedIds = JSON.parse(localStorage.getItem("viewed_memories") || "[]");
        
        // Find next unshown memory
        const nextUnshownIndex = memories.findIndex(m => !viewedIds.includes(m.id));
        
        let nextIndex;
        if (nextUnshownIndex !== -1) {
          nextIndex = nextUnshownIndex;
        } else {
          nextIndex = (prev + 1) % memories.length;
        }

        // Mark as viewed
        if (!viewedIds.includes(memories[nextIndex].id)) {
          localStorage.setItem("viewed_memories", JSON.stringify([...viewedIds, memories[nextIndex].id]));
        }

        return nextIndex;
      });
    }, 10000); // Change photo every 10 seconds

    return () => clearInterval(interval);
  }, [isActiveSession, memories]);

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
      
      ${photoCatalogText}
      
      =============================
      START OF SESSION
      =============================
      CURRENTLY DISPLAYED PHOTO [ID: ${currentMemory?.id}]
      Background context about this photo: "${currentMemory?.transcription || "It's a beautiful memory."}"${facts}
    `.trim();
    
    const token = deviceToken || localStorage.getItem("frame_token");
    await connect(context, token);
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
           Loved One: Yes, it was my favorite.
           AI: Oh, what did you like about it?
           Loved One: We had chocolate ice cream.`;
      
      console.log("Triggering Memory Harvest with transcript length:", finalTranscript.length);
      await fetch('/api/harvest', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deviceToken || localStorage.getItem("frame_token")}` 
        },
        body: JSON.stringify({
          transcript: finalTranscript,
          photoId: currentMemory?.id,
          caretakerName: currentMemory?.caretakerName,
          photoUrl: currentMemory?.photoUrl,
          patientName: patientName // Pass patient name to personalize the summary
        })
      });
      console.log("Memory Harvest complete.");
    } catch (err) {
      console.error("Failed to harvest memory:", err);
    }
  };

  const currentPhotoUrl = memories.length > 0 ? memories[currentPhotoIndex].photoUrl : "";

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-white/60">Redirecting to Caretaker Studio for setup...</p>
      </div>
    );
  }

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

                    {/* Middle: Status Text Only (No Transcript) */}
                    <div className="flex-1 min-w-0 text-center md:text-left">
                      <p className={`text-sm md:text-lg font-medium uppercase tracking-widest ${isMuted ? 'text-red-400' : 'text-emerald-400'}`}>
                        {geminiState === 'connecting' ? 'Connecting...' : 
                         geminiState === 'connected' ? (
                           isMuted ? 'Muted' : (
                             isAiTalking ? 'AI is speaking...' : (
                               hasSpoken ? 'Listening...' : 'AI is getting ready...'
                             )
                           )
                         ) : 'Session Ended'}
                      </p>
                      {geminiError && (
                        <p className="text-sm text-red-400 mt-1">{geminiError}</p>
                      )}
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

export default function MagicFrame() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <MagicFrameContent />
    </Suspense>
  );
}
