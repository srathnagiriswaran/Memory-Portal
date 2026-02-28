# Memory Portal - Project State

## Current Phase: Phase 5 - Testing & Pre-Submission

### Architecture Summary
- **Frontend**: Next.js (App Router) PWA
- **Auth**: NextAuth.js (Google OAuth) for Caretaker Studio
- **Storage**: Firebase Storage (direct photo upload from Caretaker Studio)
- **Database**: Firestore (memories collection + harvested_memories collection)
- **STT**: Google Cloud Speech-to-Text (voice note transcription)
- **Conversation**: Gemini Live API (WebSocket, v1alpha, real-time audio)
- **Insight Extraction**: Gemini Pro (post-conversation harvest)

### Completed
- [x] Planning, Architecture, AI Persona & Privacy Guardrails
- [x] Next.js app scaffolding, Firebase/Firestore config
- [x] PWA Magic Frame UI with NoSleep.js + fullscreen
- [x] Caretaker Studio: Google OAuth login, dashboard layout
- [x] **Direct photo upload to Firebase Storage** (replaced Google Photos API)
- [x] Voice Anchor recording & STT transcription (Firestore update)
- [x] Caretaker Studio: Curation queue (pending_voice) + Active vault (active)
- [x] Gemini Live hook (`useGeminiLive.ts`) — WebSocket, setupComplete handshake, separate capture/playback AudioContexts
- [x] Magic Frame: photo cycling, fullscreen, "Reminisce" button triggers Gemini Live session
- [x] Memory Harvest API (`/api/harvest`) — Gemini Pro extracts facts from conversation transcript
- [x] Harvested Memories review in Caretaker Studio (verify/reject)

### In Progress — Gemini Live Debugging
The WebSocket connection opens and sends the setup message, but the server closes the connection before `setupComplete` is received. The session goes **"Connecting" → "Session Ended"** without any conversation.

**What's been tried:**
| Attempt | API Version | Model | Result |
|---------|-------------|-------|--------|
| 1 | v1alpha | `models/gemini-2.0-flash-exp` | Original code, user reported "no interaction" |
| 2 | v1beta | `models/gemini-2.0-flash-live-001` | Session closes immediately |
| 3 | v1beta | `models/gemini-live-2.5-flash` | Session closes immediately |
| 4 (current) | v1alpha | `models/gemini-2.0-flash-live-001` | **Untested — awaiting user verification** |

**Key file**: `web-app/src/hooks/useGeminiLive.ts`

**Possible remaining causes:**
- Model name might still be wrong (try `gemini-2.0-flash-exp` as literal fallback — it's in Google's official Python SDK example)
- API key may lack Generative Language API (Live) permission — check Google AI Studio
- The `mediaChunks` audio format may not match the v1alpha contract (official JS example uses `realtimeInput.audio` not `realtimeInput.mediaChunks`, but that's for a different endpoint variant `BidiGenerateContentConstrained`)
- Console close code/reason from the browser will reveal the exact rejection cause

**Frame display bug (FIXED):** `frame/page.tsx` was showing static caretaker transcription during active session instead of live Gemini transcript. Now correctly renders the `transcript` array.

### Remaining Before Submission
- [ ] **Fix Gemini Live conversation** (critical — this IS the hackathon deliverable)
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
| `src/hooks/useGeminiLive.ts` | Gemini Live WebSocket hook (capture + playback) |
| `src/app/frame/page.tsx` | Magic Frame viewer + conversation UI |
| `src/app/studio/page.tsx` | Caretaker Studio dashboard |
| `src/components/PhotoCard.tsx` | Photo card with voice recording |
| `src/app/api/upload-photo/route.ts` | Photo upload → Firebase Storage + Firestore |
| `src/app/api/upload-voice/route.ts` | Voice note → STT → Firestore update |
| `src/app/api/memories/route.ts` | Fetch memories from Firestore |
| `src/app/api/harvest/route.ts` | Gemini Pro fact extraction from transcript |
| `src/app/api/harvested/route.ts` | Fetch/update harvested insights |
| `src/lib/firebase-admin.ts` | Firebase Admin SDK init |

### Context for Resuming
**Tell the AI:**
*"Read Projects/Personal/Memory-Portal/STATE.md and resume from 'In Progress'."*

**Priority on pickup:** Get Gemini Live working. Ask the user to open browser console on `/frame`, hit Reminisce, and share the `[GeminiLive] Closed:` log line — the close code + reason will pinpoint the server rejection cause.
