# Implementation Roadmap

## Phase 1: Foundation & The Magic Frame
*   **Goal**: Core Project Setup & Patient UI.
*   **Tasks**: 
    *   GCP Project Initialization.
    *   Next.js Monorepo Setup (Frontend/Backend).
    *   **PWA "Kiosk" UI**: Build the full-screen, always-on photo frame interface with `NoSleep.js`.

## Phase 2: Caretaker Studio & Google Ecosystem
*   **Goal**: Frictionless Data Ingestion.
*   **Tasks**:
    *   **Auth**: Implement Google Identity Services (OAuth 2.0) for the Caretaker Portal.
    *   **Google Photos API**: Integrate read-only access to fetch images from a designated "Memory Portal" shared album.
    *   **Voice Anchors**: Build the UI for caretakers to record audio notes.
    *   **STT**: Route audio notes through Google Cloud Speech-to-Text and save transcripts to Firestore.

## Phase 3: The Memory Companion (Interactive Core)
*   **Goal**: Real-time Voice Interaction.
*   **Tasks**:
    *   **Gemini Live Integration**: Set up WebSocket connections for low-latency, full-duplex audio.
    *   **System Prompting**: Define the empathetic, non-corrective "Co-Pilot" persona.
    *   **Context Injection**: Pass the Google Photos metadata and Voice Transcripts into the Gemini context window.
    *   **Interaction Flow**: Photo display -> Play Caretaker Audio -> Gemini Live takes over.

## Phase 4: The Memory Harvest (Feedback Loop)
*   **Goal**: Extracting value for the family.
*   **Tasks**:
    *   **Post-Session Hook**: Trigger a Cloud Function when a session ends.
    *   **Gemini Pro Analysis**: Send the session transcript to Gemini to extract "new memories" or "positive sentiments."
    *   **Firestore Updates**: Save harvested facts as `pending_verification`.
    *   **Email Digest**: Set up a basic CRON job or SendGrid integration to email the Caretaker summary.

## Phase 5: Demo Rehearsal & Polish
*   **Action**: Test PWA in standard browser full-screen mode (F11) to simulate the Kiosk.
*   **Action**: Validate the "Face-Saving" logic by intentionally giving incorrect answers during testing to ensure Gemini pivots correctly.
