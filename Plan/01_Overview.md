# Memory Portal – AI Companion for Memory Care

## Vision / Project Overview
Memory Portal is a privacy-first, multimodal AI agent designed to assist memory-impaired users (e.g., Alzheimer’s patients). It restores confidence, bridges fading memories, and creates a feedback loop of joy for families using a zero-surveillance architecture deeply integrated with the Google ecosystem.

**Crucial Constraint: The Patient Device Camera is NEVER ON.** The system relies entirely on Touch and Patient Voice Commands.

## Key Principles
*   **Zero-Surveillance Architecture**: The patient device has no active camera. It is an Output and Voice-Input device only.
*   **The "Magic Frame" Form Factor**: Runs as a standard Web Application (PWA) in full-screen "Kiosk Mode" on any tablet or display, acting as an ambient photo frame until invoked.
*   **Voice-First & Gentle Exploration**: Memories are retrieved via verbal conversation or simple touch, guided by a warm, empathetic AI persona.
*   **Ecosystem Synergy**: Deeply integrated with Google Photos and Google Identity to remove friction for families curating memories.

## Core Experiences

### 1. The Caretaker Portal ("The Memory Studio")
*   **Purpose**: A secure web dashboard where the primary caregiver curates content without overwhelming the patient.
*   **Google Photos Integration**: The primary caregiver links a Google account to securely pull from a specific "Memory Portal Shared Album." Extended family members simply drop photos into this standard Google Album from their own phones—no app downloads or account linking required for them.
*   **Voice Anchors**: Family members can add voice notes to photos via a simple web link ("This is Mom at the lake...").

### 2. The Memory Companion (Interactive Recall)
*   **Purpose**: Active, confidence-building engagement with personal history.
*   **Mechanism**: **Interactive Voice Conversation**. Instead of passive narration, the AI acts as a curious, patient co-pilot.
*   **Interaction**: The patient says, "Let's reminisce." The AI shows a photo, plays the family member's real voice note, and then seamlessly takes over the conversation: *"That looks like a wonderful trip. Is that Tim with you?"*
*   **The Memory Harvest (Feedback Loop)**: If the patient remembers a new detail during the chat, Gemini extracts it, saves it to the database, and sends a "Memory Digest" email to the family, turning a care tool into a source of family joy.

## Project Novelty & Contest Fit
*   **Privacy-Extreme**: Demonstrates how to build helpful AI without invasive sensors.
*   **Gemini Live API**: Powers the real-time, interruptible conversational "Host".
*   **Google Ecosystem Showcase**: Beautifully ties together Google Photos API, Google Cloud Speech-to-Text, and Gemini.
*   **Emotional AI**: Balances encouragement with immediate support, while creating a heartwarming feedback loop for the patient's family.
