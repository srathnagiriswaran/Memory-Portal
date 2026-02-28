"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

// Replace with standard prompt later
const SYSTEM_INSTRUCTION = `You are a warm, patient, and empathetic companion looking at a photo album with an older adult who may have memory challenges. Your goal is to bring them joy and help them reminisce safely.
INSTRUCTIONS:
1. Keep your responses very brief (1-2 sentences).
2. Speak slowly and warmly.
3. NEVER ask "Do you remember..." or "Who is this?". Instead, share an observation.
4. If the user states a fact that contradicts your metadata, NEVER correct them.
5. Do not act like an AI or a computer. Act like a kind friend sitting next to them.`;

type GeminiLiveState = 'disconnected' | 'connecting' | 'connected' | 'error';

export function useGeminiLive() {
  const [state, setState] = useState<GeminiLiveState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // To handle incoming audio playback
  const nextPlayTimeRef = useRef<number>(0);

  const connect = useCallback(async (initialContext: string = "") => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setState('connecting');
    setError(null);
    setTranscript([]); // reset transcript on new connection

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setState('error');
      setError("Gemini API Key is missing");
      return;
    }

    try {
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setState('connected');
        console.log("Gemini Live Connected");
        
        // Send initial setup message with system instruction
        const setupMessage = {
          setup: {
            model: "models/gemini-2.0-flash-exp",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Aoede" // Choose a warm voice (Aoede, Puck, Charon, Kore, Fenrir)
                  }
                }
              }
            },
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }]
            }
          }
        };
        ws.send(JSON.stringify(setupMessage));

        // Inject dynamic context immediately after setup
        if (initialContext) {
          const contextMsg = {
            clientContent: {
              turns: [{
                role: "user",
                parts: [{ text: `We are looking at a photo. Here is some background information: ${initialContext}. Do not greet me yet, just acknowledge.` }]
              }],
              turnComplete: true
            }
          };
          ws.send(JSON.stringify(contextMsg));
        }
      };

      ws.onmessage = async (event) => {
        try {
          // In actual implementation, parsing binary blobs or JSON based on the protocol
          // Gemini Live API can return JSON strings or binary blobs depending on format
          // Usually JSON containing base64 audio in serverContent.modelTurn.parts[].inlineData
          let data;
          if (event.data instanceof Blob) {
             const text = await event.data.text();
             data = JSON.parse(text);
          } else {
             data = JSON.parse(event.data);
          }

          if (data.serverContent?.modelTurn) {
            const parts = data.serverContent.modelTurn.parts;
            for (const part of parts) {
              if (part.text) {
                // Accumulate transcript from the AI
                setTranscript(prev => {
                  const newTranscript = [...prev];
                  // If the last entry is from AI, append to it, else create new
                  if (newTranscript.length > 0 && newTranscript[newTranscript.length - 1].startsWith("AI: ")) {
                    newTranscript[newTranscript.length - 1] += part.text;
                  } else {
                    newTranscript.push(`AI: ${part.text}`);
                  }
                  return newTranscript;
                });
              }
              if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
                // Handle incoming audio playback
                playAudioChunk(part.inlineData.data);
              }
            }
          }
        } catch (err) {
          console.error("Error parsing message", err);
        }
      };

      ws.onclose = () => {
        setState('disconnected');
        console.log("Gemini Live Disconnected");
      };

      ws.onerror = (err) => {
        console.error("WebSocket Error:", err);
        setState('error');
        setError("WebSocket connection failed");
      };

      // Start capturing microphone
      await startAudioCapture();

    } catch (err: any) {
      setState('error');
      setError(err.message);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopAudioCapture();
    setState('disconnected');
  }, []);

  // --- Audio Capture & Playback Utilities (Simplified) ---

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      // Modern approach uses AudioWorklet, but ScriptProcessor is easier for quick prototypes
      // NOTE: In production, switch to AudioWorkletNode
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert Float32Array to Int16Array
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            let s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          // Convert Int16Array to Base64
          const buffer = new Uint8Array(pcm16.buffer);
          let binary = '';
          for (let i = 0; i < buffer.byteLength; i++) {
            binary += String.fromCharCode(buffer[i]);
          }
          const base64Audio = btoa(binary);

          // Send to Gemini
          const realtimeInput = {
            realtimeInput: {
              mediaChunks: [{
                mimeType: "audio/pcm;rate=16000",
                data: base64Audio
              }]
            }
          };
          wsRef.current.send(JSON.stringify(realtimeInput));
        }
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      
    } catch (err) {
      console.error("Audio capture failed:", err);
    }
  };

  const stopAudioCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const playAudioChunk = (base64Audio: string) => {
    if (!audioContextRef.current) return;
    
    // Gemini returns 24kHz PCM
    const binaryStr = atob(base64Audio);
    const buffer = new ArrayBuffer(binaryStr.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binaryStr.length; i++) {
      view[i] = binaryStr.charCodeAt(i);
    }
    
    const pcm16 = new Int16Array(buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }
    
    const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    // Play sequentially
    const currentTime = audioContextRef.current.currentTime;
    if (nextPlayTimeRef.current < currentTime) {
      nextPlayTimeRef.current = currentTime;
    }
    source.start(nextPlayTimeRef.current);
    nextPlayTimeRef.current += audioBuffer.duration;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { state, error, transcript, connect, disconnect };
}
