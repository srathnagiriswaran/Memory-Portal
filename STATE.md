# Memory Portal - Project State

## Current Phase: Pre-Submission, Infrastructure & Deployment

### Architecture Summary
- **Frontend**: Next.js (App Router) PWA (Magic Frame) + Caretaker Studio
- **Auth**: NextAuth.js (Google OAuth) for Caretaker Studio + Secure Magic Links for Frame
- **Storage**: Firebase Storage (direct photo upload from Caretaker Studio)
- **Database**: Firestore (memories collection + family_graph + patient_profile + harvested_memories)
- **STT**: Google Cloud Speech-to-Text (voice note transcription)
- **Conversation**: Gemini Live API (WebSocket, `v1beta`, `models/gemini-2.5-flash-native-audio-latest`, real-time audio)
- **Insight Extraction**: Gemini 2.5 Flash (post-conversation harvest & periodic caregiver insights)

### Completed
- [x] Planning, Architecture, AI Persona & Privacy Guardrails
- [x] Next.js app scaffolding, Firebase/Firestore config
- [x] PWA Magic Frame UI with NoSleep.js + fullscreen
- [x] Caretaker Studio: Google OAuth login, dashboard layout (now with Tabbed UI)
- [x] **Direct photo upload to Firebase Storage**
- [x] **Multi-modal Context Entry**: Voice Anchor recording (STT) + Manual text entry & inline editing.
- [x] **Gemini Live Integration**: WebSockets with `gemini-2.5-flash-native-audio-latest`.
- [x] **Interactive VAD (Voice Activity Detection)**: Client/server-side debouncing for robust barge-in/interruptions.
- [x] **Security Fixes**: Removed `NEXT_PUBLIC_` Gemini keys; implemented Dual-Auth with secure backend device tokens for the Magic Frame.
- [x] **Tool Calling (`changePhoto`)**: Solved WebSocket disconnects; AI seamlessly invokes `changePhoto(photoId)` when conversations pivot based on semantic understanding.
- [x] **Tool Calling (`endSession`)**: Graceful AI session exits. Enforced via strict prompt guidelines and a 10-second backend failsafe timeout to prevent hanging.
- [x] **Smart Photo Prioritization**: Magic Frame tracks viewed photos via `localStorage` to always debut new memories first.
- [x] **Family Knowledge Graph**: Caretaker Studio UI and endpoints to dynamically manage patient profiles and family members, injected into the AI's context.
- [x] **Memory Harvesting Feedback Loop**: Two-phase verification. Gemini extracts positive facts and emotional summaries to a staging area. Caregivers review, edit, and approve these facts before they are permanently attached to photos as "Patient Memories".
- [x] **AI Caregiver Insights**: Generates actionable insights (Overall Mood, Current Fixations, Upload Suggestions) by analyzing recent harvested sessions. Implemented caching and auto-refresh logic.
- [x] **Emotional Tone Detection & Guardrails**: Strict instructions to validate user emotions, pivot to calming memories, and NEVER hallucinate or bring up negative/distressing topics.

### Remaining Before Submission
- [ ] Dockerization (`Dockerfile` for Next.js)
- [ ] Terraform IaC (Cloud Run, Artifact Registry, Firestore, Storage)
- [ ] Deploy to Google Cloud Run
- [ ] Record 4-minute demo video (YouTube/Vimeo)
- [ ] Technical blog post with `#GeminiLiveAgentChallenge`

### Key Files
| File | Purpose |
|------|---------|
| `src/hooks/useGeminiLive.ts` | Gemini Live WebSocket hook (capture + playback, VAD, tool response handling, failsafes) |
| `src/app/frame/page.tsx` | Magic Frame viewer, context injection, and tool execution |
| `src/app/studio/page.tsx` | Caretaker Studio dashboard (Tabs: Overview, Vault, Family, Settings) |
| `src/app/api/insights/route.ts` | Gemini 2.5 Flash endpoint for Caregiver AI Insights |
| `src/app/api/harvest/route.ts` | Gemini 2.5 Flash endpoint for extracting facts/emotions |
| `src/app/api/memories/route.ts` | Fetch/delete/update memories in Firestore |

### Context for Resuming
**Tell the AI:**
*"Read Projects/Personal/Memory-Portal/STATE.md and resume from 'Remaining Before Submission'."*

**Current Status:** All application features, AI agent loops, UI/UX polish, and security hardening for the hackathon are completely finished and verified. The next and final phase is strictly DevOps (Docker, Terraform, Google Cloud Run deployment) and project submission deliverables (Video, Blog).