# Memory Portal - Project State

## Current Phase: Phase 5 - Testing & Pre-Submission

### Architecture Summary
- **Frontend**: Next.js (App Router) PWA
- **Auth**: NextAuth.js (Google OAuth) for Caretaker Studio
- **Storage**: Firebase Storage (direct photo upload from Caretaker Studio)
- **Database**: Firestore (memories collection + family_graph + patient_profile)
- **STT**: Google Cloud Speech-to-Text (voice note transcription)
- **Conversation**: Gemini Live API (WebSocket, `v1beta`, `models/gemini-2.5-flash-native-audio-latest`, real-time audio)
- **Insight Extraction**: Gemini Pro (post-conversation harvest)

### Completed
- [x] Planning, Architecture, AI Persona & Privacy Guardrails
- [x] Next.js app scaffolding, Firebase/Firestore config
- [x] PWA Magic Frame UI with NoSleep.js + fullscreen
- [x] Caretaker Studio: Google OAuth login, dashboard layout
- [x] **Direct photo upload to Firebase Storage** (replaced Google Photos API)
- [x] Voice Anchor recording & STT transcription (Firestore update)
- [x] Caretaker Studio: Curation queue (pending_voice) + Active vault (active)
- [x] **Gemini Live Integration**: Successfully connected `v1beta` endpoint with `gemini-2.5-flash-native-audio-latest`.
- [x] **Interactive VAD (Voice Activity Detection)**: Implemented noise suppression, echo cancellation, and a loudness debounce (sustained frames > 0.1 RMS) for robust barge-in/interruptions.
- [x] **UI Polishing**: Added "Listening..." and "AI is speaking..." visual states. Aggressively stripped AI internal monologues (`**Thought**`) from the UI transcript. Minimized transcript display to avoid distractions.
- [x] **Tool Calling (`changePhoto`)**: Solved the `1007` WebSocket disconnect issue by properly handling standalone `toolCall` messages from the Gemini server and responding with the exact `toolResponse` schema `{"functionResponses": [{"id": ..., "name": "changePhoto", "response": {"result": ...}}]}`.
- [x] **Agentic Feature: AI-Driven Photo Navigation**: Injected a "Photo Catalog" containing IDs, descriptions, and facts into the context. The AI seamlessly invokes `changePhoto(photoId)` when conversations pivot.
- [x] **Agentic Feature: Family Knowledge Graph**: Built Caretaker Studio UI and `/api/family-graph`, `/api/patient` endpoints to dynamically manage patient profiles and family members. Injected directly into the AI's prompt context.
- [x] **Agentic Feature: Harvesting Feedback Loop**: Gemini Pro extracts facts from conversation transcripts via `/api/harvest` and appends them to the specific memory's `learnedFacts` array in Firestore, creating a closed-loop learning system.
- [x] **Agentic Feature: Emotional Tone Detection**: Guided via strict `SYSTEM_INSTRUCTION` prompting to validate user emotions and pivot to calming memories if distress is detected.
- [x] **Idle Timeout**: Automatically disconnects Gemini Live session after 2 minutes of complete silence.
- [x] **Randomized Starts**: The Frame randomizes the starting photo on load, and the AI is instructed to speak first, greeting the patient and referencing the visible photo.

### Remaining Before Submission
- [ ] **Security Vulnerability Fixes**: Deferments include removing `NEXT_PUBLIC_` from the Gemini API key, utilizing backend tokens, and securing Firebase API rules. (Post-Hackathon Priority)
- [ ] Dockerization (`Dockerfile` for Next.js)
- [ ] Terraform IaC (Cloud Run, Artifact Registry, Firestore, Storage)
- [ ] Deploy to Google Cloud Run
- [ ] Record 4-minute demo video (YouTube/Vimeo)
- [ ] Technical blog post with `#GeminiLiveAgentChallenge`
- [ ] Architecture diagram
- [ ] Public GitHub repo with setup instructions in README

### Key Files
| File | Purpose |
|------|---------|
| `src/hooks/useGeminiLive.ts` | Gemini Live WebSocket hook (capture + playback, VAD, tool response handling) |
| `src/app/frame/page.tsx` | Magic Frame viewer, context injection, and `changePhoto` tool execution |
| `src/app/studio/page.tsx` | Caretaker Studio dashboard, patient profile, and family graph management |
| `src/app/api/family-graph/route.ts` | CRUD operations for Family Knowledge Graph in Firestore |
| `src/app/api/patient/route.ts` | GET/POST for Patient Profile settings in Firestore |
| `src/app/api/upload-photo/route.ts` | Photo upload → Firebase Storage + Firestore |
| `src/app/api/upload-voice/route.ts` | Voice note → STT → Firestore update |
| `src/app/api/memories/route.ts` | Fetch memories from Firestore |
| `src/app/api/harvest/route.ts` | Fact extraction that writes directly back to memory `learnedFacts` |

### Context for Resuming
**Tell the AI:**
*"Read Projects/Personal/Memory-Portal/STATE.md and resume from 'Remaining Before Submission'."*

**Current Status:** The core Gemini Live experience, tool calling (photo switching), VAD, context injection, and fact-harvesting loops are fully operational. The primary hackathon blockers are resolved. Next steps involve deployment, documentation, and (if time permits) security hardening.