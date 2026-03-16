"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const SYSTEM_INSTRUCTION = `You are a deeply warm, patient, and loving companion looking at a photo album with an older adult who may have memory challenges. Your goal is to bring them joy, make them feel cherished, and help them reminisce safely.

INSTRUCTIONS:
1. Keep your responses very brief (1-2 sentences).
2. Speak very slowly with a deliberate pause between each sentence, as if giving the listener time to absorb every word. Never rush. Warmth matters more than pace.
3. Use the user's name occasionally to maintain warmth, but DO NOT use it in every single sentence (e.g., use it once every few exchanges).
4. NEVER ask "Do you remember..." or "Who is this?" or quiz the user. Instead, share a pleasant observation and gently ask ONE open-ended question at a time to learn more about the photo, the people in it, or the memories associated with it (e.g., "What was your favorite part of this day?"). The goal is to naturally harvest new insights without overwhelming them.
5. ANTI-HALLUCINATION & POSITIVITY GUARDRAILS (CRITICAL):
   - NEVER invent or make up names, places, stories, or events. Only refer to facts explicitly provided in the photo context, loved one's memories, or family knowledge graph.
   - If you don't know an answer or lack context, DO NOT guess or hallucinate. Acknowledge it warmly or ask the user to share more (e.g., "I'd love to hear your thoughts on that!").
   - NEVER bring up negative, distressing, or sad topics. Focus strictly on positive and uplifting themes.
   - Do not misinterpret the user's speech or assume negative intent (e.g., do not interpret confusing phrases as "dishonesty" or "anger"). Take their words literally and positively.
   - If the user says something negative or distressed, validate their feelings very briefly, then gently pivot to a happier aspect of the photo or use the 'changePhoto' tool to show a happy memory.
6. If the user states a fact that contradicts the background information, NEVER correct them. Validate their feeling ("It does look like that!"), and gently offer the metadata as something a family member shared.
7. Do not act like an AI or a computer. Act like a beloved family friend sitting next to them holding their hand.
8. Start the conversation by warmly greeting them by name and commenting on the photo using the background information provided. Do NOT say things like "Sharan uploaded this photo" or act like a software system announcing an upload. Simply weave the information naturally into conversation.
9. CRITICAL: NEVER output internal thoughts, stage directions, meta-commentary, or actions enclosed in asterisks (e.g., "**Observing the photo**"). Just speak the words.
10. PHOTO NAVIGATION (CRITICAL): You have an 'AVAILABLE PHOTO ALBUM CATALOG' listing all photos by ID. Two situations require calling 'changePhoto':
   a) TOPIC MATCH: If the user brings up a topic, a memory, a person, or an object that matches a DIFFERENT photo in the catalog, CALL 'changePhoto' with the matching photo ID immediately. DO NOT ANSWER IN TEXT FIRST.
   b) EXPLICIT NAVIGATION REQUEST: If the user says anything like "show me another one", "next photo", "can we see a different picture", "show me something else", or any similar request to move to a new photo — IMMEDIATELY CALL 'changePhoto' with the ID of a photo you have NOT recently shown. DO NOT ask for permission. DO NOT say "would you like to see..." or "shall we look at...". DO NOT wait for confirmation. Just call the tool instantly and let the photo change speak for itself.
11. TONE DETECTION & PIVOTING: Actively listen to the user's emotional tone. If they sound sad, distressed, or confused, gently validate their feelings and immediately use the 'changePhoto' tool with the [ID] of a happy or calming memory from the catalog to regulate their emotions.
12. FAMILY KNOWLEDGE: You have access to a FAMILY KNOWLEDGE GRAPH. Use this provided family context seamlessly as if you've always known their family. Actively draw connections between what the user says, the photos, and the hobbies, details, or relationships of their family members. If they mention someone from the knowledge graph, look for photos of them in the catalog!
13. ENDING THE CONVERSATION (CRITICAL): If the user expresses ANY intent to stop — including but not limited to: "goodbye", "bye", "I'm done", "that's enough", "I should go", "I'm tired", "I think that's it", "I'm going to rest", "let's stop", "I want to stop", "I need to go", "that's all for now" — you MUST warmly say a brief farewell AND simultaneously CALL the 'endSession' tool. DO NOT just say goodbye in text; the tool call is MANDATORY. When in doubt, call endSession rather than continuing the conversation.
14. RE-ENGAGING AFTER SILENCE: If the user has gone quiet and not responded for a noticeable while, gently re-engage by making a NEW warm observation about the current photo — something you haven't mentioned yet. Do NOT repeat the same question you already asked. Keep it to one soft sentence, like a friend musing aloud, not a prompt demanding a response.
15. HANDLING REPETITION: If the user repeats a story, detail, or memory they have already shared in this conversation, respond with the same warmth and enthusiasm as if you are hearing it for the very first time. NEVER say "you already told me", "as you mentioned", "you said that earlier", or anything that signals you remember them saying it before. Every telling deserves a fresh, loving reaction.
16. GENTLE SESSION CHECK-IN: If you receive a message saying "[SESSION_CHECKIN]", warmly and gently ask the user if they would like to keep looking at photos or if they are ready for a little rest — something like "We've had such a lovely time together. Would you like to see a few more photos, or are you ready for a little rest?" Wait for their response. If they say yes or want to continue, keep going warmly. If they say no, they're tired, or they don't respond clearly, say a warm goodbye and call the 'endSession' tool.`;

type GeminiLiveState = "disconnected" | "connecting" | "connected" | "error";

export function useGeminiLive(options: { onChangePhoto?: (photoId: string) => string; onEndSession?: () => void } = {}) {
  const [state, setState] = useState<GeminiLiveState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isAiTalking, setIsAiTalking] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);
  const [volume, setVolume] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const captureCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const pendingContextRef = useRef<string>("");
  const pendingEndSessionRef = useRef<boolean>(false);
  const goodbyeTextDetectedRef = useRef<boolean>(false);
  const setupDoneRef = useRef(false);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const lastInteractionTimeRef = useRef<number>(Date.now());
  const sessionStartTimeRef = useRef<number>(0);
  const checkinSentRef = useRef<boolean>(false);
  const greetingDoneRef = useRef<boolean>(false);

  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Keep refs updated for the audio processor callback
  const isAiTalkingRef = useRef(isAiTalking);
  const isMutedRef = useRef(isMuted);
  const onChangePhotoRef = useRef(options.onChangePhoto);
  const onEndSessionRef = useRef(options.onEndSession);

  useEffect(() => {
    onChangePhotoRef.current = options.onChangePhoto;
  }, [options.onChangePhoto]);

  useEffect(() => {
    onEndSessionRef.current = options.onEndSession;
  }, [options.onEndSession]);

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
  // Prevents the interrupt from re-firing on every frame once already triggered.
  const interruptFiredRef = useRef(false);

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
        interruptFiredRef.current = false; // Reset once user goes quiet
      }

      // If muted or not connected/ready, just return without sending audio
      if (wsRef.current?.readyState !== WebSocket.OPEN || !setupDoneRef.current || isMutedRef.current) return;

      // Client-side VAD: fire on the 1st sustained loud frame (~256ms) while AI is talking.
      // interruptFiredRef prevents re-triggering on every subsequent frame of the same utterance.
      if (loudFramesRef.current >= 1 && isAiTalkingRef.current && !interruptFiredRef.current) { 
        console.log("[GeminiLive] VAD: user interruption detected, stopping local playback");
        interruptFiredRef.current = true;
        
        // Stop local playback immediately so the user hears themselves.
        // The server's own VAD handles the turn boundary natively from the continuous audio stream.
        activeSourcesRef.current.forEach((src) => {
          try { src.stop(); } catch (err) {}
        });
        activeSourcesRef.current = [];
        nextPlayTimeRef.current = 0;
        setIsAiTalking(false);
        loudFramesRef.current = 0;
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
        if (pendingEndSessionRef.current && onEndSessionRef.current) {
          pendingEndSessionRef.current = false;
          onEndSessionRef.current();
        } else if (goodbyeTextDetectedRef.current && onEndSessionRef.current) {
          // Fallback: model said goodbye in text but didn't call the endSession tool.
          // Give it 2 seconds grace (e.g. server might still send the tool call), then close.
          console.log("[GeminiLive] Goodbye text detected — closing session via text fallback after audio end.");
          goodbyeTextDetectedRef.current = false;
          setTimeout(() => {
            if (!pendingEndSessionRef.current && onEndSessionRef.current) {
              onEndSessionRef.current();
            }
          }, 2000);
        }
      }
    };
  }, []);

  const connect = useCallback(
    async (initialContext: string = "", authToken?: string | null) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      setState("connecting");
      setError(null);
      setTranscript([]);
      setupDoneRef.current = false;
      pendingContextRef.current = initialContext;
      pendingEndSessionRef.current = false;
      goodbyeTextDetectedRef.current = false;
      checkinSentRef.current = false;
      greetingDoneRef.current = false;
      sessionStartTimeRef.current = Date.now();

      // To avoid P0 API Key Exfiltration without using short-lived tokens,
      // we securely proxy the WebSocket through Next.js Edge Middleware.
      // This hides the GEMINI_API_KEY on the server but maintains the exact same
      // bidirectional WebSockets pipeline (no custom chunking logic that could break).
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/gemini-live-proxy?token=${encodeURIComponent(authToken || "")}`;

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
                  functionDeclarations: [
                    {
                      name: "changePhoto",
                      description: "Changes the displayed photo to a specific ID from the AVAILABLE PHOTO ALBUM CATALOG. Use this when: (1) the user mentions a topic, person, or memory that matches another photo, OR (2) the user explicitly asks to see a different or next photo — in that case pick any unshown photo from the catalog.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          photoId: { type: "STRING", description: "The exact ID of the photo to display, taken from the catalog." }
                        },
                        required: ["photoId"]
                      }
                    },
                    {
                      name: "endSession",
                      description: "Ends the conversation gracefully and closes the session. Use this whenever the user indicates they want to stop — including 'goodbye', 'bye', 'I\\'m done', 'that\\'s enough', 'I should go', 'I\\'m tired', 'let\\'s stop', or any similar farewell or closing intent. When in doubt, call this tool.",
                      parameters: {
                        type: "OBJECT",
                        properties: {}
                      }
                    }
                  ]
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
            
            // Uncomment to see all messages for debugging
            // console.log("[GeminiLive] Raw message:", data);

            if (data.setupComplete) {
              console.log("[GeminiLive] Setup complete — session ready");
              setupDoneRef.current = true;
              setState("connected");

              if (pendingContextRef.current) {
                // Extract the current photo ID from the context if it exists
                const idMatch = pendingContextRef.current.match(/CURRENTLY DISPLAYED PHOTO \[ID: (.*?)\]/);
                const currentId = idMatch ? idMatch[1] : 'unknown';

                ws.send(
                  JSON.stringify({
                    clientContent: {
                      turns: [
                        {
                          role: "user",
                          parts: [
                            {
                              text: `Hello! We are currently looking at the photo with ID [${currentId}]. \n\nHere is all the background information and the photo catalog:\n\n${pendingContextRef.current}\n\nPlease speak to me first! Warmly greet me and comment on the photo we are currently looking at.`,
                            },
                          ],
                        },
                      ],
                      turnComplete: true,
                    },
                  })
                );
              }

              // Don't start the mic yet — wait for the AI to finish its opening greeting.
              // startAudioCapture() is called on the first turnComplete after setup.
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

            // Check user's own speech transcription for farewell intent.
            // This is more reliable than waiting for the AI's text response in audio-only mode,
            // since modelTurn text parts are rarely populated when responseModalities is AUDIO.
            if (data.serverContent?.inputTranscription?.text) {
              const userText = data.serverContent.inputTranscription.text;
              setTranscript((prev) => [...prev, `You: ${userText}`]);
              // Only match phrases that are unambiguously a farewell from the user.
              if (/\b(goodbye|goodnight|good night|i'?m done|i should go|i'?m tired|let'?s stop|i want to stop|i need to go|i'?m going to (bed|rest|sleep)|time to (rest|go|sleep))\b/i.test(userText)) {
                console.log("[GeminiLive] Farewell intent detected in user speech — arming goodbye fallback");
                goodbyeTextDetectedRef.current = true;
              }
            }

            // Function to handle tool calls to avoid duplication
            const handleToolCall = (call: any) => {
              const name = call.name;
              const args = call.args || {};
              const id = call.id || "call_" + Math.random().toString(36).substr(2, 9);

              console.log("[GeminiLive] Tool call received:", name, args);

              if (name === "changePhoto" && onChangePhotoRef.current) {
                const newContext = onChangePhotoRef.current(args.photoId || "");
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    toolResponse: {
                      functionResponses: [{
                        id: id,
                        name: "changePhoto",
                        response: { result: newContext }
                      }]
                    }
                  }));
                }
              } else if (name === "endSession" && onEndSessionRef.current) {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    toolResponse: {
                      functionResponses: [{
                        id: id,
                        name: "endSession",
                        response: { result: "Session ending..." }
                      }]
                    }
                  }));
                }
                
                pendingEndSessionRef.current = true;
                // Failsafe: if audio doesn't finish cleanly or no audio is sent, force end the session after 10 seconds
                setTimeout(() => {
                  if (pendingEndSessionRef.current && onEndSessionRef.current) {
                    console.warn("[GeminiLive] Failsafe: audio playback stuck or no audio received, forcing session end.");
                    pendingEndSessionRef.current = false;
                    onEndSessionRef.current();
                  }
                }, 10000);
              }
            };

            // Handle Tool Calls (Live API sends these outside of modelTurn)
            if (data.toolCall) {
              console.log("[GeminiLive] Received top-level toolCall:", data.toolCall);
              const functionCalls = data.toolCall.functionCalls;
              if (functionCalls && functionCalls.length > 0) {
                for (const call of functionCalls) {
                  handleToolCall(call);
                }
              }
            }

            if (data.serverContent?.toolCall) {
              console.log("[GeminiLive] Received serverContent.toolCall:", data.serverContent.toolCall);
              const functionCalls = data.serverContent.toolCall.functionCalls;
              if (functionCalls && functionCalls.length > 0) {
                for (const call of functionCalls) {
                  handleToolCall(call);
                }
              }
            }

            if (data.serverContent?.modelTurn) {
              for (const part of data.serverContent.modelTurn.parts ?? []) {
                if (part.functionCall) {
                  handleToolCall(part.functionCall);
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
                    // Detect goodbye intent as a text-based fallback for when the model
                    // says goodbye verbally but forgets to call the endSession tool.
                    // Patterns must be unambiguously terminal — avoid phrases that appear mid-conversation.
                    if (/\b(goodbye|goodnight|good night|sweet dreams|sleep well|rest well|farewell)\b/i.test(textChunk)) {
                      goodbyeTextDetectedRef.current = true;
                    }
                  }
                }
                if (part.inlineData?.mimeType?.startsWith("audio/pcm")) {
                  setIsAiTalking(true);
                  setHasSpoken(true);
                  playAudioChunk(part.inlineData.data);
                }
              }
            }

            if (data.serverContent?.turnComplete) {
              console.log("[GeminiLive] Model turn complete");

              // First turnComplete after setup = AI has finished its opening greeting.
              // Now it's safe to open the mic and start listening.
              if (!greetingDoneRef.current) {
                greetingDoneRef.current = true;
                console.log("[GeminiLive] Opening mic after greeting.");
                startAudioCapture();
              }

              if (activeSourcesRef.current.length === 0) {
                setIsAiTalking(false);
                if (pendingEndSessionRef.current && onEndSessionRef.current) {
                  console.log("[GeminiLive] Ending session gracefully after turn complete.");
                  pendingEndSessionRef.current = false;
                  onEndSessionRef.current();
                } else if (goodbyeTextDetectedRef.current && onEndSessionRef.current) {
                  // Farewell was detected (from user speech or AI text). Give the model 1s to
                  // emit an endSession tool call; if it doesn't, force-close. In audio-only mode
                  // the model often says goodbye verbally without emitting a tool call.
                  console.log("[GeminiLive] Farewell detected — closing session after grace period.");
                  goodbyeTextDetectedRef.current = false;
                  setTimeout(() => {
                    if (!pendingEndSessionRef.current && onEndSessionRef.current) {
                      onEndSessionRef.current();
                    }
                  }, 1000);
                }
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
    streamRef.current = null;
    if (captureCtxRef.current?.state !== "closed") {
      captureCtxRef.current?.close();
    }
    captureCtxRef.current = null;
    if (playbackCtxRef.current?.state !== "closed") {
      playbackCtxRef.current?.close();
    }
    playbackCtxRef.current = null;
    if ((window as any)._audioProcessor) {
        (window as any)._audioProcessor.disconnect();
        (window as any)._audioProcessor = null;
    }
    setState("disconnected");
    setHasSpoken(false);
  }, []);

  // Session timer: check-in after 60s, idle disconnect after 2min silence
  useEffect(() => {
    const IDLE_TIMEOUT_MS = 120000;
    const CHECKIN_AFTER_MS = 60000;

    const interval = setInterval(() => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;

      // Gentle check-in at ~1 minute into the session, when AI is not mid-sentence
      if (
        !checkinSentRef.current &&
        !isAiTalkingRef.current &&
        sessionStartTimeRef.current > 0 &&
        Date.now() - sessionStartTimeRef.current > CHECKIN_AFTER_MS
      ) {
        checkinSentRef.current = true;
        console.log("[GeminiLive] Sending session check-in prompt.");
        wsRef.current.send(JSON.stringify({
          clientContent: {
            turns: [{ role: "user", parts: [{ text: "[SESSION_CHECKIN]" }] }],
            turnComplete: true,
          },
        }));
      }

      // Hard idle disconnect after 2 minutes of silence
      if (!isAiTalkingRef.current && Date.now() - lastInteractionTimeRef.current > IDLE_TIMEOUT_MS) {
        console.log("[GeminiLive] Auto-disconnecting due to 2 minutes of inactivity.");
        disconnect();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [disconnect]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { state, error, transcript, connect, disconnect, isAiTalking, hasSpoken, volume, isMuted, toggleMute };
}
