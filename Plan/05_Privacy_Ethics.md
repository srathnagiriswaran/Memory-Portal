# Ethics & Privacy Guardrails

## Core Principles
1.  **Consent**: All sessions require explicit consent (physical token or user initiation).
2.  **Bounded Access**: Memory access is strictly scoped to the "Memory Vault". No external internet searches for personal data.
3.  **No Surveillance**: Camera/microphone are **passive** by default. Only active after specific trigger events.
4.  **Emotional Safety**: The system prioritizes the user's emotional state over factual accuracy.
5.  **Data Retention**: Sessions end completely. No long-term retention of conversation history beyond the session scope.

## Operational Rules

### For The Memory Companion
*   **Errorless Learning**: The AI never corrects the user. If the user is wrong or confused, the AI gently provides the correct context as if it were a shared realization. "That looks just like [Name]!"
*   **Anti-Interrogation**: Questions are framed as "sharing" ("That looks like a fun trip") rather than "testing" ("Where was this?").
*   **Source of Truth**: The AI relies **exclusively** on annotations provided by loved ones. It does not invent backstory.
*   **Curated Safety**: Only photos/memories explicitly approved by caregivers are accessible. This prevents surfacing traumatic or confusing events (e.g., deceased relatives the patient believes are alive, unless clinically approved).

## Implementation Checklist
- [ ] **Hard-Stop Mechanism**: Implement immediate audio cut-off (Barge-in) for user interruptions.
- [ ] **Sentiment Analysis**: Integrate logic to detect distress (long pauses, agitation) and trigger "Passive Mode".
- [ ] **Data Scoping**: Ensure RAG retrieval is strictly limited to the specific user's `verified_memories` collection.
- [ ] **Wipe Session**: Create function to clear temporary context/cache immediately upon session end.
