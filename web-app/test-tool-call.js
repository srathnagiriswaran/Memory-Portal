const WebSocket = require('ws');

const apiKey = "***REDACTED_GEMINI_KEY***";

const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log("Connected");
  ws.send(JSON.stringify({
    setup: {
      model: "models/gemini-2.5-flash-native-audio-latest",
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Aoede" }
          }
        }
      },
      tools: [{
        functionDeclarations: [{
          name: "getTime",
          description: "Gets the current time",
          parameters: { type: "OBJECT", properties: {} }
        }]
      }]
    }
  }));
});

let gotToolCall = false;

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());

  if (gotToolCall) {
    console.log("POST TOOL CALL MESSAGE:", JSON.stringify(msg).substring(0, 200));
  }

  if (msg.setupComplete) {
    console.log("Setup complete");
    ws.send(JSON.stringify({
      clientContent: {
        turns: [{
          role: "user",
          parts: [{ text: "Please use the getTime tool right now and tell me what time it is." }]
        }],
        turnComplete: true
      }
    }));
  }

  if (msg.serverContent && msg.serverContent.modelTurn) {
    const parts = msg.serverContent.modelTurn.parts;
    parts.forEach(part => {
      if (part.text) console.log("AI TEXT:", part.text);
      if (part.inlineData) console.log("AI AUDIO CHUNK");
    });
  }

  if (msg.toolCall) {
    gotToolCall = true;
    console.log("Got top-level toolCall:", msg.toolCall);
    ws.send(JSON.stringify({
      toolResponse: {
        functionResponses: [{
          id: msg.toolCall.functionCalls[0].id,
          name: "getTime",
          response: { time: "12:00 PM" }
        }]
      }
    }));
  }
});

ws.on('close', (code, reason) => {
  console.log(`Disconnected: ${code} ${reason}`);
  process.exit(1);
});
