# 🧠 Memory Portal & Magic Frame
### Bridging Generations with the Power of Gemini Live AI

**A submission for the Google Gemini API Developer Competition**
**Category:** Live Agents
**Live Application:** [https://memory-portal-app-uqp246quja-uc.a.run.app](https://memory-portal-app-uqp246quja-uc.a.run.app)

---

## 🌻 The Human Touch: Why I Built This

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
*   **👨‍👩‍👧‍👦 Multi-Caregiver Support:** Caregiving is a team effort. The primary caregiver can seamlessly invite other family members via email to join the portal. Invited caregivers get secure access to upload photos, record stories, and view insights, ensuring the whole family can contribute to the Magic Frame experience.
*   **🎙️ Multi-Modal Family Vault:** Caregivers don't have to type long paragraphs. They can simply speak into their phones to drop voice notes on photos (powered by GCP Speech-to-Text). This instantly anchors the image with deep, personal context (names, relationships, inside jokes) for the AI to weave into conversation.
*   **🤝 Barge-In Ready & Empathetic:** The AI can be interrupted naturally. It stops, listens, and responds just like a human. Strict anti-hallucination and positivity guardrails guarantee every interaction is safe, grounded, and uplifting.
*   **👋 Graceful Session Management:** The AI is trained to recognize conversational closing cues (e.g., "I'm tired," "goodbye") and will autonomously invoke an `endSession` tool to naturally say farewell and transition the frame back to its quiet, ambient state.

---

## ⚙️ Under the Hood: Technical Features

Memory Portal is engineered to meet the strict demands of real-time, interruptible AI while maintaining robust security.

*   **⚡ True Live Agent via WebSockets:** Powered directly by the Gemini Live WebSocket API (`gemini-2.5-flash-native-audio-latest`), ensuring the low-latency, full-duplex communication required for natural "barge-in" interruptions. 
*   **☁️ 100% Serverless Cloud-Native:** The entire infrastructure—Next.js frontend/API, Firestore database, and Firebase Storage—is designed to run natively and auto-scale on Google Cloud Platform (target deployment: Cloud Run).
*   **🔐 Dual-Authentication Architecture:** Implements a strict security boundary using NextAuth.js (Google OAuth) for the Caretaker Studio, and secure, zero-trust, rotating Device Tokens (Magic Links) for the patient-facing Magic Frame.
*   **🤖 Chained AI Pipeline:** I use a dual-model approach: Gemini Live API handles the real-time, low-latency conversation, while a secondary Gemini 2.5 Flash model runs asynchronously post-session to extract structured JSON data (Memory Harvesting and Insights).
*   **🎤 Seamless Transcriptions:** Integrated with Google Cloud Speech-to-Text to accurately transcribe caregiver voice notes into semantic context for the database.
*   **🛡️ Zero-Surveillance Design:** The patient interface utilizes client-side Voice Activity Detection (VAD). Audio is only streamed to the API when sustained human speech is detected, and the camera is never accessed, ensuring absolute privacy.

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
Because I am dealing with sensitive family data and vulnerable users, security is not an afterthought. I use a **Dual-Authentication Strategy**:
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

This application is designed to be fully containerized and deployed to **Google Cloud Run** using Terraform. I use **Google Secret Manager (GSM)** to manage all sensitive keys, ensuring they are never exposed in plaintext or committed to the repository.

### Quick Deploy (One-Click Update)

Once the initial infrastructure is set up, you can build, push, and deploy a new version of the app seamlessly using the included bash script:

```bash
./deploy.sh
```

This script will:
1. Extract your `NEXT_PUBLIC_` env variables for the Docker build.
2. Build the Docker image specifically for `linux/amd64` (Cloud Run's architecture) and tag it with your current git commit hash.
3. Push the image to Google Artifact Registry.
4. Auto-update the Terraform `terraform.tfvars` file with the newly built image tag.
5. Run `terraform apply -auto-approve` to seamlessly update the Cloud Run service.

### Infrastructure as Code (Terraform)

All Google Cloud resources are provisioned via Terraform in the `terraform/` directory.

🔗 **[Read the Full Deployment & Terraform Guide Here](./terraform/README.md)**

*Note on State Files:* Terraform state files (`*.tfstate`) are explicitly ignored in `.gitignore` to prevent leaking sensitive information if you are running Terraform locally. For a multi-developer team, consider configuring a GCS backend for remote state storage.

---

*Built with ❤️ for the Google Gemini API Developer Competition.*
