# Use Case 2: Consent-Driven Visitor Introduction (The Perfect Entrance)

**Purpose**: A seamless, magical transition from "Ambient Room" to "Personal Welcome" triggered by the visitor. This prepares the patient *before* the encounter, replacing the anxiety of "Who is this?" with the confidence of knowing.

## The Persona: "The Warm Announcer"
*   **Role**: An invisible, helpful butler or concierge.
*   **Tone**: Gentle, clear, reassuring, and brief.
*   **Goal**: To provide immediate context without demanding cognitive effort. It does not ask questions; it simply states facts warmly to "set the stage."
*   **Voice Style**: Soothing, slightly slower pace, with a "smile" in the voice.
*   **Sample Dialogue**: *"Sarah, your grandson Liam is here for lunch. He loves gardening."* (It avoids: "Do you know who is at the door?" or "Someone is here!")

## Workflow Nodes

1.  **Arrival (Visitor Mobile)**
    *   Visitor scans QR Code (`/room/101`).
    *   **Auth Check**: Cookie-based or PIN.
    *   **Intent**: Select "Lunch" / "Visit".
    *   **Photo Step**: "Add photo for this visit?" (Optional Upload).
    *   **Action**: Taps "Knock".

2.  **The "Magic" Transition (Patient Display)**
    *   **Hardware State (MVP)**: Device plugged in, "Auto-Lock: Never", Browser in Fullscreen.
    *   **Software State**: App shows a black background ("Fake Sleep") or Ambient Loop.
    *   **Wake Event**: Firestore subscription receives `session_start`.
    *   **Action**:
        *   Remove Black Overlay / Blur Ambient Video.
        *   Play "Warm Chime" Audio (Fade-in).
        *   Fade in **Bridge Photo** with "Ken Burns" animation.

3.  **The Narrator (AI Host)**
    *   **Generation**: "Sarah, your grandson Liam is here for lunch."
    *   **Audio**: Plays TTS.
    *   **End State**: Silence.

## Guardrails & Safety
1.  **Identity Verification (No Guessing)**: The system **NEVER** announces a visitor unless they have physically authenticated via the QR code token. It never uses facial recognition to identify strangers.
2.  **Zero Ambiguity**: Introductions follow a strict structure: `[Patient Name]`, `[Relationship]`, `[Visitor Name]`, `[Context/Intent]` to minimize cognitive load.
3.  **Positive Priming Only**: The "Context" provided (e.g., "He loves gardening") is strictly filtered for positive sentiment to ensure the patient is primed for a happy interaction.
4.  **Audio "Fade-In"**: Audio must always be preceded by a gentle chime and fade in to prevent startling the patient.

## MVP Constraints
*   **Always On**: The Patient Device must prevent system sleep (via `NoSleep.js` or OS settings) to ensure it can receive the "Knock" signal instantly via WebSocket/Firestore.
