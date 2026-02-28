# Use Case 1: The Memory Companion & "Memory Harvest"

**Mechanism**: Idle Frame -> Voice/Touch Trigger -> Family Voice Note -> Co-Pilot Conversation -> Post-Session Memory Harvest.

**Concept**: A digital photo frame that transforms into a patient, curious companion. It guides the user through memory pathways safely, and reports newfound moments of clarity back to the family.

## Workflow Nodes

### 1. The Frictionless Curation (Family)
*   **Google Photos Shared Album**: The primary caretaker links the portal to a specific Google Photos album. Extended family members simply share photos to this album via their native phone apps. No new accounts needed for them.
*   **The Voice Anchor**: The primary caretaker logs into the "Memory Studio" portal, sees the new photos, and records a 10-second voice note: *"Hey Mom, it's Liam. Look at this picture of Dad at the lake in 1998."*
*   **Transcription**: Google Cloud Speech-to-Text transcribes this note to provide the AI its absolute "Ground Truth."

### 2. Invocation (The Magic Frame)
*   **Idle State**: The tablet runs a PWA in full-screen (Kiosk Mode). It slowly cycles through approved, ambient photos.
*   **Trigger**: The patient taps a large, permanent "Reminisce" button on the screen, or says "Helper, let's look at a memory."
*   **The Anchor**: The screen shows the lake photo and *plays Liam's actual recorded voice note first*. This grounds the patient in reality using a familiar voice.

### 3. The Co-Pilot Conversation
*   **Persona**: A patient, warm, unhurried companion.
*   **Handoff**: After Liam's voice note finishes, the AI gently chimes in via Gemini Live.
*   *AI*: "Liam picked a wonderful photo. The water looks so blue! Do you remember if it was a windy day?"

### 4. "Face-Saving" Interaction Logic
The system analyzes the User's response:
*   **Confident Recall**: 
    *   *User*: "Yes, Tim's hat almost blew off!"
    *   *AI*: "Oh, that sounds like quite an adventure! Tim looks like he's having fun driving."
*   **Hesitation / Confusion**: 
    *   *User*: "I... I don't know..."
    *   *AI (Immediate Pivot)*: "It looks a bit breezy in the picture! Liam mentioned this was from 1998. It looks like a beautiful trip." (Never correct, always support).

### 5. The Memory Harvest (Feedback Loop)
This is the magical payoff for the family.
*   During the conversation, the patient mentioned a new detail: *"Tim dropped his ice cream in the sand that day."*
*   **Post-Processing**: Once the session ends, Gemini Pro analyzes the transcript. It identifies that the "ice cream" detail is new and not in the original metadata.
*   **The Digest**: At the end of the week, the Caretaker Portal sends an email to the family: 
    *   *"Great news! Sarah spent 10 minutes looking at the Lake Tahoe album. She sounded happy and remembered that Tim dropped his ice cream in the sand!"*
*   **Verification**: The family can click "Add to Vault." This fact is added to the AI's permanent knowledge graph for future conversations.

## AI Guardrails & Safety
*   **Strict Ground Truth**: The AI **ONLY** relies on the metadata and voice transcripts provided by the family. It will not hallucinate external facts.
*   **Single Question Rule**: The AI persona is prompted to never ask compound questions to avoid overwhelming the user.
*   **Stress Abort**: If long silences or agitated voice tones are detected, the AI gracefully exits: "These are such lovely pictures. I'll just leave this one on the screen for you to enjoy."
