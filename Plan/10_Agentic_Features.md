# Agentic AI Features: Memory Companion

This document outlines the four advanced agentic capabilities integrated into the Memory Portal to transform the AI from a simple "talking picture frame" into an intelligent, proactive "Memory Companion."

## 1. AI-Driven Photo Navigation (Function Calling)

**Concept:** 
Instead of the user passively looking at one photo, the AI can dynamically change the photo on the screen to guide the conversation. If a user brings up a related topic (e.g., a pet, another family member, or a past vacation), the AI can proactively search the user's photo album and display a relevant image.

**Architecture:**
- **Gemini Live Setup:** The `useGeminiLive` hook initializes the WebSocket connection with a `tools` payload, defining the `changePhoto` function.
- **Trigger:** The `gemini-2.5-flash-native-audio` model decides when to invoke this tool based on the conversation flow.
- **Execution:** When the server sends a `functionCall` message, the React hook intercepts it and triggers an `onChangePhoto` callback in the main `MagicFrame` component.
- **State Update:** The `MagicFrame` searches its loaded `memories` for a match against the requested theme/keyword, updates the `currentPhotoIndex`, and returns the new photo's background context.
- **Function Response:** The hook immediately sends a `functionResponse` back to the Gemini Live API with the new context, allowing the AI to seamlessly continue the conversation about the newly displayed photo.

## 2. Family Knowledge Graph

**Concept:**
To make conversations deeply personal and natural, the AI needs context beyond just the single photo it's looking at. It needs to know the "cast of characters" in the user's life.

**Architecture:**
- **Data Structure:** A "Family Knowledge Graph" (currently a descriptive string, eventually a structured JSON object fetched from the DB) is injected into the initial AI setup.
- **Injection:** It is appended to the `SYSTEM_INSTRUCTION` or the initial `clientContent` prompt.
- **Usage:** If the user says, "He looks like his sister here," the AI uses the Knowledge Graph to know the sister's name without having to ask the user, preserving the illusion of a long-term companion who "remembers" the family.

## 3. Emotional Tone Detection & Adaptation

**Concept:**
The `native-audio` model processes raw audio, meaning it can detect *how* something is said (prosody, tone, emotion), not just the words. We leverage this to make the AI an empathetic caregiver.

**Architecture:**
- **Prompt Engineering:** The `SYSTEM_INSTRUCTION` explicitly instructs the AI to monitor the user's emotional tone.
- **Behavioral Pivot:** If the AI detects sadness, distress, or confusion, it is instructed to validate the emotion gently. Crucially, it uses the `changePhoto` tool to proactively pivot the conversation to a "happy" or "calming" theme, acting as an emotional regulator for the patient.

## 4. The "Harvesting" Feedback Loop

**Concept:**
As the patient reminisces, they often reveal new facts, correct historical inaccuracies, or share deeply personal stories that the family didn't know or didn't include in the original metadata. We want to capture this and enrich the album.

**Architecture:**
- **End of Session:** When the session ends, the full conversation transcript is sent to the `/api/harvest` endpoint.
- **Fact Extraction:** A separate `gemini-2.5-flash` model analyzes the transcript to extract newly discovered facts.
- **Write-Back (The Loop):** The endpoint not only saves these to a `harvested_memories` collection for family review but also directly appends them to a `learnedFacts` array on the original `memories` document in Firestore.
- **Future Context:** The next time this photo is viewed, the `learnedFacts` are included in the initial prompt, proving to the patient that the AI "remembers" their past conversations.
