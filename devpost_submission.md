# Memory Portal - Bridging Generations with the Power of Gemini Live AI

## 🌻 Inspiration: The Quiet Isolation of Memory Loss

The most painful part of memory loss isn't just forgetting the past. It's the quiet isolation it creates in the present.

When a loved one experiences cognitive decline, looking at old photo albums can be a beautiful but lonely experience. Families want to be there 24/7 to guide those reminiscing sessions, to answer the same questions with infinite patience, and to bring those still images to life with the rich stories behind them. But they simply can't.

Memory is a muscle, and human connection is its fuel. I was inspired to build **Memory Portal** to act as a gentle "gym for the mind." The goal was never to replace human interaction, but to sustain it, helping individuals facing memory challenges hold onto their family, their stories, and their sense of self for as long as possible.

## 🖼️ What it Does: The "Magic Frame"

I transformed an ordinary tablet into a **Magic Frame**. By day, it's a passive, ambient digital photo frame prioritizing the newest memories uploaded by the family.

But with a single tap of **"Reminisce"**, the magic happens. It awakens an empathetic, patient, and warm AI companion. This isn't an AI that just "describes an image." It uses a deep **Family Knowledge Graph** and personal stories recorded in the caregiver's own voice to engage in a fluid, real-time, voice-to-voice conversation.

- **It exercises neural pathways** by gently encouraging active recall.
- **It never corrects or shames**. If the patient gets confused, the AI gracefully pivots using *Errorless Learning* principles.
- **It actively listens**: If a loved one mentions their grandson Mark, the AI autonomously triggers a tool to instantly bring up a photo of Mark on the screen.

It acts as an infinitely patient co-pilot, while quietly sending joyful updates and actionable emotional insights back to the family via a secure Caretaker Studio.

## 🏗️ How I Built It

Memory Portal is a monolithic Next.js application built to run 100% Serverless on Google Cloud Platform, utilizing a "Chained AI" pipeline.

### 1. The Real-Time Engine (Gemini Live API)
The core experience is powered by the `gemini-2.5-flash-native-audio-latest` model connected via WebSockets. This was mandatory to achieve true full-duplex communication. If the user gets confused and interrupts the AI, the AI must stop immediately and listen. Standard REST polling is too slow for empathetic care.

### 2. The Asynchronous Harvester (Gemini 2.5 Flash via SDK)
After a session ends, the transcript is securely passed to a secondary model using the official `@google/genai` SDK. This model runs a "Harvesting" prompt to extract newly discovered facts (like *"User revealed they used to hate this dog"*) and updates the Firestore database, making the AI "smarter" for the next session.

### 3. Google Cloud Native Infrastructure
- **Hosting**: Next.js deployed via Docker to **Google Cloud Run**.
- **Database & Storage**: **Firebase Firestore** for the Knowledge Graph and **Firebase Storage** for family photos.
- **Context Generation**: Caregivers can record voice notes on their phones, which are transcribed using the **Google Cloud Speech-to-Text API** to feed context to Gemini.
- **Security**: **Google Secret Manager (GSM)** is used to inject API keys securely at runtime, provisioned via **Terraform**.

## 🚧 Challenges I Ran Into

### The "Therapist" vs. "Interrogator" Problem
Initially, Gemini was too eager. It would ask, *"Do you remember who is in this picture?"* For someone with memory loss, this creates intense anxiety.
**Solution:** I had to heavily engineer the `SYSTEM_INSTRUCTION` to enforce "Errorless Learning." I explicitly banned quizzing and forced the AI to state facts gently (*"This is a lovely picture of you and your son, John..."*) and ask open-ended, low-pressure questions (*"How does this picture make you feel?"*).

### Managing Audio State in React
Handling raw PCM audio streaming, playback, and simultaneous Voice Activity Detection (VAD) within a Next.js client component was incredibly complex.
**Solution:** I built a custom hook (`useGeminiLive`) that leverages the Web Audio API and an `AudioWorkletNode` to manage a ring buffer. I implemented client-side loudness debouncing to ensure the microphone only transmits data when sustained human speech is detected, preserving privacy and reducing API costs.

### Secure Dual-Authentication
The Caretaker Studio needs heavy security (Google OAuth), but a patient cannot be expected to log in.
**Solution:** I built a secure "Magic Link" system. The caregiver logs in, generates a rotating Device Token, and opens the link on the tablet. The token is saved to local storage, and the frontend securely requests the Gemini API keys from the backend before establishing the WebSocket connection.

## 🧠 What I Learned

The biggest technical takeaway was mastering **Multimodal Tool Calling over WebSockets**. Watching Gemini listen to a conversation, realize the topic shifted to "the beach trip," and autonomously fire a `changePhoto` JSON payload over the socket to instantly update the React UI felt like pure magic.

More importantly, I learned that AI's greatest potential isn't just in raw intelligence, but in *patience*. We can build systems that don't just compute, but care.
