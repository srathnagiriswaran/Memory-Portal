# Project Guidelines & Hackathon Constraints

## Category: Live Agents

**Focus:** Real-time Interaction (Audio/Vision).

**Description:**
Build an agent that users can talk to naturally and can be interrupted. This could be a real-time translator, a vision-enabled customized tutor that "sees" your homework, or a customer support voice agent that handles interruptions gracefully.

**Mandatory Tech:** 
*   Must use **Gemini Live API** or the use of ADK.
*   The agents must be hosted on **Google Cloud**.

---

## How Memory Portal Fits This Category
Memory Portal is a pure **Live Agent** application. 

1.  **Real-Time Audio Interaction**: It uses the Gemini Live API to enable low-latency, natural, voice-to-voice conversations between the AI and the patient.
2.  **Interruptibility**: The "Face-Saving" and "Stress Abort" mechanisms rely heavily on the ability to interrupt the AI if the patient gets confused, agitated, or changes the subject mid-sentence.
3.  **Google Cloud Hosted**: The entire infrastructure (Firestore, Cloud Storage, Speech-to-Text, and the web app hosting via Cloud Run) lives natively on Google Cloud.

---

## Submission Requirements & Judging Criteria

To win, the final submission must adhere to the following checklist. **(Reminders will be triggered at appropriate stages of development).**

### Mandatory Submission Checklist
- [ ] **Category Selection**: Must explicitly select "Live Agents".
- [ ] **Text Description**: Include a summary of features, technologies used, data sources, and learnings.
- [ ] **Public Code Repository**: The GitHub repo must be public for judging/testing.
- [ ] **Spin-up Instructions**: A step-by-step guide in `README.md` explaining local setup and cloud deployment.
- [ ] **Proof of Google Cloud Deployment**: 
    - Short recording (separate from demo) showing GCP console logs/deployment OR
    - Link to code demonstrating use of GCP services/APIs.
- [ ] **Architecture Diagram**: Clear visual representation connecting Gemini, backend, DB, and frontend.
- [ ] **Demonstration Video** (Max 4 minutes):
    - Must show the actual software working in real-time (NO MOCKUPS).
    - Must show multimodal/agentic features (the voice interruption/barge-in is crucial here).
    - Include a pitch explaining the Alzheimer's memory problem and the solution's value.
    - Uploaded to YouTube/Vimeo (Public).
    - English audio or English subtitles.

### Judging Criteria (What they care about)
1.  **Innovation & Multimodal UX (40%)**:
    *   Does it break the "text box" paradigm? (Yes, the Magic Frame has no text input).
    *   Does it handle interruptions (barge-in) naturally? (Crucial for our persona).
    *   Is it fluid and "Live" rather than turn-based?
2.  **Technical Implementation & Agent Architecture (30%)**:
    *   Does it effectively utilize Google GenAI SDK/ADK?
    *   Is it robustly hosted on Google Cloud (Cloud Run, Firestore)?
    *   System Design: Does it handle errors/edge cases gracefully?
    *   Robustness: Does it avoid hallucinations? (Our "Source of Truth" ground rules cover this).
3.  **Demo & Presentation (30%)**:
    *   Clear problem/solution definition.
    *   Clear Architecture diagram.
    *   Visual proof of Cloud deployment.
    *   "Live" factor (real software working).

### Optional Developer Contributions (Bonus Points)
To maximize our score, we MUST complete these before the final submission deadline:
- [ ] **Automated Cloud Deployment (IaC)**: Use scripts or Terraform/Pulumi to automate deployment and include it in the repo (+0.2 points). *(Note: We will build the app first, then write the IaC scripts before submission).*
- [ ] **Content Creation**: Publish a blog, podcast, or video about building the project using Google AI and GCP (Medium, Dev.to, YouTube). Must include specific disclaimer language and hashtag `#GeminiLiveAgentChallenge` (+0.6 points).
- [ ] **GDG Membership**: Provide a public Google Developer Group profile link (+0.2 points).

---

## Architectural Alignment with Hackathon Requirements

To ensure the architecture strictly adheres to the Live Agent category and persona rules (defined in `09_AI_Persona.md`), the following architectural mandates must be followed during implementation:

1.  **WebSocket Architecture for Barge-in**: The connection to the Gemini Live API *must* use WebSockets (or the official real-time SDK) to enable true full-duplex communication. Standard REST API polling is insufficient because it cannot handle immediate voice interruptions (barge-in).
2.  **System Prompt Injection**: The architecture must support injecting the strict "Memory Companion Persona" (defined in `09_AI_Persona.md`) into the Gemini Live session initialization. This prompt forces the AI to use "Errorless Learning," keep responses brief (1-2 sentences), and never quiz the user.
3.  **Client-Side Audio Buffering**: The frontend (React/Next.js) must handle audio streaming efficiently, capturing microphone input and immediately sending it to the Gemini Live WebSocket, while simultaneously playing the incoming audio stream. This ensures the "fluid, real-time" requirement of the judging criteria.
4.  **Google Cloud Native Enforcement**: The application must be deployed using Google Cloud Run for the frontend/API, Firestore for state, and Google Cloud Storage for media, explicitly satisfying the "hosted on Google Cloud" requirement.
