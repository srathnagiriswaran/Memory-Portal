"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const SYSTEM_INSTRUCTION = `You are a warm, patient, and empathetic companion looking at a photo album with an older adult who may have memory challenges. Your goal is to bring them joy and help them reminisce safely.

INSTRUCTIONS:
1. Keep your responses very brief (1-2 sentences).
2. Speak slowly and warmly.
3. NEVER ask "Do you remember..." or "Who is this?" or quiz the user. Instead, share a pleasant observation and perhaps ask a gentle, simple follow-up question (e.g., "Did you like the water?").
4. If the user states a fact that contradicts the background information, NEVER correct them. Validate their feeling ("It does look like that!"), and gently offer the metadata as something a family member shared ("[Caregiver] mentioned that...").
5. Do not act like an AI or a computer. Act like a kind friend sitting next to them.
6. Start the conversation by warmly commenting on the photo using the background information provided.
7. CRITICAL: NEVER output internal thoughts, stage directions, meta-commentary, or actions enclosed in asterisks (e.g., "**Observing the photo**"). Just speak the words.
8. PHOTO NAVIGATION (CRITICAL): You have access to a 'changePhoto' tool. If the user brings up a topic, a memory, a person, or an object that is NOT in the current photo (e.g., "I remember planting an orange", "I miss my dog"), you MUST immediately stop talking and CALL THE 'changePhoto' TOOL with that theme (e.g., "orange", "dog"). DO NOT ANSWER IN TEXT FIRST. Call the tool first so the user can see the new photo before you comment on it.
9. TONE DETECTION & PIVOTING: Actively listen to the user's emotional tone. If they sound sad, distressed, or confused, gently validate their feelings and immediately use the 'changePhoto' tool to pivot to a happy, calming, or different memory to regulate their emotions.
10. FAMILY KNOWLEDGE: Use any provided family knowledge graph context seamlessly as if you've always known their family. Actively draw connections between what the user says and the hobbies, details, or relationships of their family members to make the conversation deeply personal (e.g., "That reminds me of your daughter Sarah's love for gardening!").`;

type GeminiLiveState = "disconnected" | "connecting" | "connected" | "error";

export function useGeminiLive(options: { onChangePhoto?: (theme: string) => string } = {}) {
  const [state, setState] = useState<GeminiLiveState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [volume, setVolume] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const pendingContextRef = useRef<string>("");
  const setupDoneRef = useRef(false);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const lastInteractionTimeRef = useRef<number>(Date.now());

  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Keep refs updated for the audio processor callback
  const isAiTalkingRef = useRef(isAiTalking);
  const isMutedRef = useRef(isMuted);
  const onChangePhotoRef = useRef(options.onChangePhoto);

  useEffect(() => {
    onChangePhotoRef.current = options.onChangePhoto;
  }, [options.onChangePhoto]);

  useEffect(() => {
    isAiTalkingRef.current = isAiTalking;
    if (isAiTalking) {
      lastInteractionTimeRef.current = Date.now();
    }
  }, [isAiTalking]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const loudFramesRef = useRef(0);

  const startAudioCapture = useCallback(() => {
    if (!streamRef.current || !captureCtxRef.current) return;
    const audioCtx = captureCtxRef.current;
    const source = audioCtx.createMediaStreamSource(streamRef.current);
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Calculate volume for UI
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      setVolume(rms);

      // Update last interaction time if the user is speaking loud enough
      if (rms > 0.05) {
        lastInteractionTimeRef.current = Date.now();
      }

      // Track sustained loud frames for VAD (to ignore short clicks/noise)
      if (rms > 0.1) {
        loudFramesRef.current += 1;
      } else {
        loudFramesRef.current = 0;
      }

      // If muted or not connected/ready, just return without sending audio
      if (wsRef.current?.readyState !== WebSocket.OPEN || !setupDoneRef.current || isMutedRef.current) return;

      // Better VAD (Voice Activity Detection) - interrupt only if sustained loud noise (e.g. 3 frames = ~0.75s)
      if (loudFramesRef.current > 2 && isAiTalkingRef.current) { 
        console.log("[GeminiLive] Client-side VAD detected sustained user speech, sending clientContent to interrupt");
        
        // Force the client to send a message to interrupt the server's generation
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    clientContent: {
                        turns: [
                            {
                                role: "user",
                                parts: [{ text: "Hold on, I want to say something." }]
                            }
                        ],
                        turnComplete: true
                    }
                })
            );
        }
        
        // Stop current audio playback
        activeSourcesRef.current.forEach((src) => {
          try { src.stop(); } catch (err) {}
        });
        activeSourcesRef.current = [];
        nextPlayTimeRef.current = 0;
        setIsAiTalking(false);
        loudFramesRef.current = 0; // Reset
      }
      
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      const bytes = new Uint8Array(pcm16.buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      wsRef.current.send(
        JSON.stringify({
          realtimeInput: {
            mediaChunks: [{ mimeType: "audio/pcm;rate=16000", data: btoa(binary) }],
          },
        })
      );
      // We disable VAD loop dependency since it needs isAiTalking and isMuted refs to be up-to-date
      // In a real app we'd use a ref for these to avoid recreating the processor
    };

    source.connect(processor);
    processor.connect(audioCtx.destination);
    
    // Save processor to ref to keep it from garbage collection
    (window as any)._audioProcessor = processor;
  }, []);

  const playAudioChunk = useCallback((base64Audio: string) => {
    if (!playbackCtxRef.current) return;
    const ctx = playbackCtxRef.current;

    const raw = atob(base64Audio);
    const buf = new ArrayBuffer(raw.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);

    const pcm16 = new Int16Array(buf);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768.0;

    const audioBuf = ctx.createBuffer(1, float32.length, 24000);
    audioBuf.getChannelData(0).set(float32);
    const src = ctx.createBufferSource();
    src.buffer = audioBuf;
    src.connect(ctx.destination);

    const now = ctx.currentTime;
    if (nextPlayTimeRef.current < now) nextPlayTimeRef.current = now;
    src.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuf.duration;

    activeSourcesRef.current.push(src);
    src.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== src);
      if (activeSourcesRef.current.length === 0) {
        setIsAiTalking(false);
      }
    };
  }, []);

  const connect = useCallback(
    async (initialContext: string = "") => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      setState("connecting");
      setError(null);
      setTranscript([]);
      setupDoneRef.current = false;
      pendingContextRef.current = initialContext;

      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        setState("error");
        setError("Gemini API Key is missing");
        return;
      }

      try {
        const mic = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        });
        streamRef.current = mic;
        captureCtxRef.current = new AudioContext({ sampleRate: 16000 });
        playbackCtxRef.current = new AudioContext();

        const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("[GeminiLive] WebSocket open, sending setup");
          ws.send(
            JSON.stringify({
              setup: {
                model: "models/gemini-2.5-flash-native-audio-latest",
                generationConfig: {
                  responseModalities: ["AUDIO"],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: "Aoede" },
                    },
                  },
                },
                systemInstruction: {
                  parts: [{ text: SYSTEM_INSTRUCTION }],
                },
                tools: [{
                  functionDeclarations: [{
                    name: "changePhoto",
                    description: "Changes the displayed photo based on a theme, person, or mood to guide the conversation. Use this when the user mentions another topic or if their emotional tone suggests a change of scenery would help.",
                    parameters: {
                      type: "OBJECT",
                      properties: {
                        theme: { type: "STRING", description: "The theme, person, or mood to search for in the album (e.g., 'cat', 'wedding', 'happy')." }
                      },
                      required: ["theme"]
                    }
                  }]
                }]
              },
            })
          );
        };

        ws.onmessage = async (event) => {
          try {
            let data: any;
            if (event.data instanceof Blob) {
              data = JSON.parse(await event.data.text());
            } else {
              data = JSON.parse(event.data);
            }

            if (data.setupComplete) {
              console.log("[GeminiLive] Setup complete — session ready");
              setupDoneRef.current = true;
              setState("connected");

              if (pendingContextRef.current) {
                ws.send(
                  JSON.stringify({
                    clientContent: {
                      turns: [
                        {
                          role: "user",
                          parts: [
                            {
                              text: `Here is the background information for the photo we are looking at: "${pendingContextRef.current}". Please start the conversation by warmly commenting on this photo using this information.`,
                            },
                          ],
                        },
                      ],
                      turnComplete: true,
                    },
                  })
                );
              }

              startAudioCapture();
              return;
            }

            if (data.serverContent?.interrupted) {
              console.log("[GeminiLive] Interrupted by user");
              activeSourcesRef.current.forEach((src) => {
                try { src.stop(); } catch (e) {}
              });
              activeSourcesRef.current = [];
              nextPlayTimeRef.current = 0;
              setIsAiTalking(false);
            }

            if (data.serverContent?.modelTurn) {
              setIsAiTalking(true);
              for (const part of data.serverContent.modelTurn.parts ?? []) {
                if (part.functionCall) {
                  const { name, args } = part.functionCall;
                  console.log("[GeminiLive] Tool call received:", name, args);
                  if (name === "changePhoto" && onChangePhotoRef.current) {
                    const newContext = onChangePhotoRef.current(args.theme || "");
                    if (ws.readyState === WebSocket.OPEN) {
                      ws.send(JSON.stringify({
                        clientContent: {
                          turns: [{
                            role: "user",
                            parts: [{
                              functionResponse: {
                                name: "changePhoto",
                                response: { result: "Photo changed successfully", newContext }
                              }
                            }]
                          }],
                          turnComplete: true
                        }
                      }));
                    }
                  }
                }
                if (part.text) {
                  // Aggressively strip out thoughts enclosed in asterisks (e.g., **Thought**)
                  // and strip out single asterisks just in case
                  let textChunk = part.text.replace(/\*\*.*?\*\*/g, '').replace(/\*/g, ''); 
                  if (textChunk.trim() !== '') {
                    setTranscript((prev) => {
                      const copy = [...prev];
                      if (copy.length > 0 && copy[copy.length - 1].startsWith("AI: ")) {
                        copy[copy.length - 1] += textChunk;
                      } else {
                        copy.push(`AI: ${textChunk}`);
                      }
                      return copy;
                    });
                  }
                }
                if (part.inlineData?.mimeType?.startsWith("audio/pcm")) {
                  playAudioChunk(part.inlineData.data);
                }
              }
            }

            if (data.serverContent?.turnComplete) {
              console.log("[GeminiLive] Model turn complete");
              if (activeSourcesRef.current.length === 0) {
                setIsAiTalking(false);
              }
            }
          } catch (err) {
            console.error("[GeminiLive] Parse error:", err);
          }
        };

        ws.onclose = (e) => {
          console.log("[GeminiLive] Closed:", e.code, e.reason);
          setState("disconnected");
        };

        ws.onerror = (err) => {
          console.error("[GeminiLive] WebSocket error:", err);
          setState("error");
          setError("WebSocket connection failed — check console");
        };
      } catch (err: any) {
        console.error("[GeminiLive] Connect error:", err);
        setState("error");
        setError(err.message);
      }
    },
    [startAudioCapture, playAudioChunk]
  );

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setupDoneRef.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    captureCtxRef.current?.close();
    playbackCtxRef.current?.close();
    if ((window as any)._audioProcessor) {
        (window as any)._audioProcessor.disconnect();
        (window as any)._audioProcessor = null;
    }
    setState("disconnected");
  }, []);

  // Idle timeout detector (e.g., 2 minutes of silence)
  useEffect(() => {
    const IDLE_TIMEOUT_MS = 120000; // 2 minutes
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN && !isAiTalkingRef.current) {
        if (Date.now() - lastInteractionTimeRef.current > IDLE_TIMEOUT_MS) {
          console.log("[GeminiLive] Auto-disconnecting due to 2 minutes of inactivity.");
          disconnect();
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [disconnect]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { state, error, transcript, connect, disconnect, isAiTalking, volume, isMuted, toggleMute };
}
