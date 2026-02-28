# Memory Portal: Partner Pitch & Experience Deep Dive

## 1. The Big Idea
**Restoring the confidence to connect.**

Memory Portal is a privacy-first AI companion designed for those living with Alzheimer's. It acts as an instant **"memory bridge,"** actively contextualizing the present moment—whispering names or recalling events on command—to instantly fill the frightening gaps left by memory loss.

**The Impact:** It turns a moment of confusion into a moment of connection. By offering the right memory at the right time, it restores dignity, allows patients to engage in conversation without fear, and creates a beautiful feedback loop of joy for their families.

---

## 2. Core Use Cases & Workflows

### Use Case 1: The Memory Companion & "Memory Harvest"
**The Problem:** Passive screen time accelerates cognitive decline. Traditional "memory testing" causes stress. Families feel disconnected when they aren't physically present.
**The Fix:** A "Magic Frame" that transforms into an interactive, voice-first companion. The AI acts as a curious co-pilot, safely guiding the patient through memories and sharing their moments of clarity back with the family.

#### The Experience Deep Dive
*   **Before:** Sarah sits alone watching TV. Her personal memories fade from lack of use. Her family worries about her cognitive state but doesn't know how to engage her remotely.
*   **With Memory Portal:**
    1.  **The Trigger:** Sarah taps the "Reminisce" button on her Magic Frame.
    2.  **The Anchor:** A photo of a lake trip appears, and she hears a recording of her son's actual voice: *"Hey Mom, look at this picture of Dad at the lake..."*
    3.  **The Journey:** The AI gently takes over: *"The water looks so blue! Do you remember if it was a windy day?"*
    4.  **The Success:** Sarah smiles. *"Yes, Tim dropped his ice cream in the sand!"*
    5.  **The Harvest:** That Friday, her son gets an email: *"Sarah had a great day today. Looking at the Tahoe album, she remembered Tim dropping his ice cream."* The family feels deeply connected to her present moment.

#### Workflow
1.  **Frictionless Data Ingestion:** The primary caretaker connects the portal to a Google Photos Shared Album. Extended family simply drops photos into the album from their phones.
2.  **Voice Query:** Patient asks for a memory or taps the screen.
3.  **Co-Pilot Logic:** AI plays the family voice note, then generates a "shared curiosity" prompt.
4.  **Interaction:** Patient responds. AI reinforces or gracefully pivots if the patient is confused.
5.  **Memory Harvest:** Gemini Pro extracts new facts from the session transcript and sends a digest to the family.

---

### Use Case 2: The Perfect Entrance (Immediate Social Confidence)
**The Problem:** The anxiety of a visitor arriving and the panic of *"Who is this?"*
**The Fix:** A seamless, zero-touch greeting that prepares the patient *before* the visitor enters.

#### The Experience Deep Dive
*   **Before:** Doorbell rings. Sarah panics. Liam enters, she looks blank. Liam feels heartbroken; Sarah feels ashamed.
*   **With Memory Portal:**
    1.  **Arrival:** Liam scans a small QR code at the door on his phone.
    2.  **The Signal:** The system identifies him instantly (no facial recognition, just the token).
    3.  **The Bridge:** Inside, Sarah's screen chimes warmly. The AI whispers: *"Sarah, your grandson Liam is here for lunch. He loves gardening."*
    4.  **The Connection:** When Liam walks in, Sarah smiles and says, *"Liam! How is your garden?"* The gap is bridged.

---

## 3. The "Co-Pilot" Persona & Safety Guardrails
To ensure emotional safety, the AI is not a generic assistant. It is a specialized **Care Companion**.

### The Persona
*   **Relationship:** Like a kind, patient friend.
*   **Tone:** Warm, curious, unhurried.
*   **Rule:** It never "tests" the user; it *shares* the moment.

### Critical Guardrails
1.  **Errorless Learning (Face-Saving Logic):**
    *   The system **NEVER** corrects the user directly.
    *   *User:* "I think that's... John?" (It's Tim).
    *   *AI (Pivot):* "It looks a bit like John! Liam mentioned this was Tim from 1998. It's such a lovely photo." -> **Dignity preserved.**
2.  **Zero Hallucinations:**
    *   The AI relies **exclusively** on Google Photos metadata and transcripts provided by loved ones. It does not invent backstory.
3.  **Sentiment "Abort Switch":**
    *   If the system detects stress (shaky voice, long silence, frustration), it immediately drops the "question mode" and reverts to a comforting, passive narrator.

---

## 4. Strategic Fit & Viability (What Partners Need to Know)

*   **Low Barrier to Entry:** This is a **Web App (PWA)** running in Kiosk Mode. It runs on any existing tablet (e.g., Pixel Tablet, iPad). No proprietary hardware is required.
*   **Privacy-First:** The patient device camera is **NEVER ON**. There is no surveillance. All inputs are deliberate (Voice or Touch).
*   **Ecosystem Synergy:** Deeply integrates with the Google ecosystem (Google Photos API, Google Identity, Google Cloud Speech-to-Text, Gemini Live, Gemini Pro) to create a frictionless experience for families.
*   **The "Killer Feature":** The "Memory Harvest" email digest transforms the product from just a patient aid into an emotional lifeline for the entire family.
