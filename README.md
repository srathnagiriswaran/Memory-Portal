# 🧠 Memory Portal & Magic Frame
### Bridging Generations with the Power of Gemini Live AI

**A submission for the Google Gemini API Developer Competition**
**Category:** Live Agents

---

## 🌻 The Human Touch: Why We Built This

Memory loss doesn't just steal the past; it isolates the present. For individuals experiencing cognitive decline, dementia, or Alzheimer's, looking at old photo albums can be a beautiful but lonely experience. For family members and caregivers, it's often difficult to be there 24/7 to guide those reminiscing sessions, answer repeated questions with patience, or bring those still images to life with the rich stories behind them.

**Memory Portal** transforms an ordinary tablet into a **Magic Frame**. It acts as an ambient digital photo frame during the day, prioritizing the newest memories uploaded by the family. But when the user taps "Reminisce", it awakens an empathetic, patient, and warm AI companion powered by the **Gemini Live API**. 

This companion doesn't just "describe an image." It uses a deep **Family Knowledge Graph** and the personal stories recorded by the caregiver to engage in a fluid, real-time, voice-to-voice conversation. If the patient gets confused, it gently pivots. If they mention their grandson Mark, the AI uses its tool-calling capabilities to instantly bring up a photo of Mark on the screen. It is an infinitely patient friend, designed with *Errorless Learning* principles, ensuring the user always feels safe, heard, and loved.

---

## ✨ The "Wow" Factor: Platform Features

Memory Portal isn't just a technical achievement; it's designed to create magical, emotional moments that bridge generations. 

*   **🖼️ The Interactive "Magic" Frame:** It's not just a passive digital photo album. With a single tap of "Reminisce," the ambient display transforms into a deeply engaging, low-latency voice companion that *knows* the stories behind the pictures. It's a zero-friction interface—no typing, no logins, just conversation.
*   **🧠 Semantic Photo Surfacing (Tool Calling):** The AI actively listens to the flow of conversation. If a loved one mentions "fishing with John," the Gemini AI autonomously triggers a `changePhoto` tool to instantly bring up the fishing trip photo on the screen, creating a serendipitous and fluid reminiscing experience.
*   **🌱 AI Memory Harvesting:** The system learns, grows, and remembers. After every chat, a background Gemini model quietly distills new facts and emotional insights from the transcript. It automatically builds a richer, long-term memory graph so the AI remembers what the loved one shared for their next session.
*   **💡 Actionable Caregiver Insights:** Families don't just get raw transcripts; they get peace of mind. The Caretaker Studio provides a beautiful dashboard summarizing their loved one's overall mood, current topics of fixation, and AI-driven suggestions for what specific photos to upload next to spark joy.
*   **🎙️ Multi-Modal Family Vault:** Caregivers don't have to type long paragraphs. They can simply speak into their phones to drop voice notes on photos (powered by GCP Speech-to-Text). This instantly anchors the image with deep, personal context (names, relationships, inside jokes) for the AI to weave into conversation.
*   **🤝 Barge-In Ready & Empathetic:** Powered by the Gemini Live WebSocket API (`gemini-2.5-flash-native-audio-latest`), the AI can be interrupted naturally. It stops, listens, and responds just like a human. Strict anti-hallucination and positivity guardrails guarantee every interaction is safe, grounded, and uplifting.
*   **👋 Graceful Session Management:** The AI is trained to recognize conversational closing cues (e.g., "I'm tired," "goodbye") and will autonomously invoke an `endSession` tool to naturally say farewell and transition the frame back to its quiet, ambient state.

---

## 🏗️ Architecture & Security

Memory Portal is a monolithic Next.js application built to run 100% Serverless on Google Cloud Platform. 

**Core Technologies:**
*   **Frontend & API:** Next.js (App Router)
*   **Real-time AI:** Gemini Live API (WebSocket)
*   **Post-processing AI:** Gemini Pro (REST)
*   **Transcription:** Google Cloud Speech-to-Text
*   **Database & Storage:** Firebase / Firestore & Firebase Storage
*   **Hosting:** Google Cloud Run (Target Deployment)

**Security First:**
Because we are dealing with sensitive family data and vulnerable users, security is not an afterthought. We use a **Dual-Authentication Strategy**:
1.  **Caregivers** authenticate via NextAuth.js (Google OAuth).
2.  **Magic Frames** use a secure, one-time device token generated from the Caretaker Studio.
3.  **Zero-Surveillance:** Audio is processed using client-side Voice Activity Detection (VAD). The microphone only sends data when human speech is occurring. Cameras are *never* accessed.
4.  **No Exposed Keys:** The Gemini API keys never touch the client bundle. They are securely injected via authenticated backend routes.

🔗 **[Read the Full System Architecture Document Here](./Plan/02_Architecture.md)**
🔗 **[Read about the specialized AI Persona & Rules Here](./Plan/09_AI_Persona.md)**

---

## 🚀 Spin-Up Instructions (Local Development)

To run this project locally, you will need a Google Cloud Project with the Gemini API enabled, and a Firebase project with Firestore and Storage configured.

### 1. Clone the Repository
```bash
git clone https://github.com/srathnagiriswaran/Memory-Portal.git
cd Memory-Portal/web-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the `web-app` directory. Use `.env.example` as a template.

```env
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-32-char-secret"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"

# Gemini APIs
GEMINI_API_KEY="your-gemini-api-key"

# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="your-firebase-service-account-email"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"

# Firebase Client SDK (Public)
NEXT_PUBLIC_FIREBASE_API_KEY="your-client-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-firebase-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"

# Magic Frame Security
FRAME_SECRET_KEY="a-super-secret-key-for-generating-device-tokens"
```

### 4. Run the Development Server
```bash
npm run dev
```

### 5. Access the App
*   **Caretaker Studio:** Navigate to `http://localhost:3000/studio`. Log in using your Google account. Upload photos, add family members, and record context.
*   **Magic Frame Setup:** From the Studio, click "Copy Setup Link" in the Magic Frame Setup section. Open this link on the tablet/device that will act as the Magic Frame.

---

## ☁️ Google Cloud Deployment

This application is designed to be easily containerized and deployed to **Google Cloud Run**.

1.  **Dockerize:** A standard Next.js Dockerfile can be used to build the image.
2.  **Artifact Registry:** Push the image to GCP Artifact Registry.
3.  **Cloud Run:** Deploy the container, passing all environment variables (or using Google Secret Manager for `GEMINI_API_KEY`, `FIREBASE_PRIVATE_KEY`, etc.). Ensure WebSockets are supported by your Cloud Run configuration (enabled by default).

*(Detailed Terraform/IaC scripts are planned for a future release).*

---

*Built with ❤️ for the Google Gemini API Developer Competition.*