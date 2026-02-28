# Caretaker Studio UI / UX Specification

## Overview
The "Caretaker Studio" is the control center for the primary caregiver. It is a responsive web application designed to work seamlessly on both mobile (phones) and desktop (laptops/tablets). Its primary goal is to make curating memories and managing the patient's "Magic Frame" as frictionless as possible.

## Core Principles
1.  **Mobile-First Design**: Caregivers are often on the go. Adding a quick voice note or approving a photo should take seconds from their phone.
2.  **Dashboard Simplicity**: The interface should be clean and uncluttered, prioritizing recent activity and pending actions.
3.  **Joyful Feedback**: The portal isn't just an admin tool; it's where the family receives the "Memory Harvest" updates, turning it into a source of connection.

## Key Screens & User Flows

### 1. The Dashboard (Home)
This is the main landing page upon logging in (via Google OAuth).
*   **Hero Section**: "Sarah's Frame is Currently: [Active / Idle]".
*   **Recent Memory Harvest**: A prominent card highlighting the latest insights from Gemini Pro.
    *   *Example*: "In yesterday's session, Sarah remembered that Tim dropped his ice cream at the beach." -> [Verify & Add to Vault Button].
*   **Pending Actions**: "You have 3 new photos in the Shared Album needing Voice Anchors."

### 2. The Curation Queue (The Inbox)
This screen pulls un-annotated photos from the designated Google Photos Shared Album.
*   **Grid View**: Shows thumbnails of newly added photos from extended family.
*   **Action Flow (Mobile optimized)**:
    1.  Tap a photo.
    2.  Screen shows the photo full-screen with a large "Hold to Record" microphone button.
    3.  Caregiver records: *"Hey Mom, it's Liam. Look at this picture of Dad at the lake in 1998."*
    4.  (Behind the scenes: Google STT transcribes the audio. The transcript is shown on screen for a quick edit if needed).
    5.  Tap "Send to Vault". The photo is now active on the Magic Frame.

### 3. The Memory Vault (The Library)
A gallery view of all active memories currently available to the patient's Magic Frame.
*   **Organization**: Grouped by "Core Memories," "Recent Events," or "People."
*   **Management**: Caregivers can toggle a photo's visibility (e.g., if a photo causes distress, they can easily hide it).
*   **Edit Anchor**: Ability to re-record the voice note or manually edit the Ground Truth metadata used by Gemini.

### 4. Settings & Guardrails
Where the primary caregiver controls the AI's behavior and system limits.
*   **Google Integration**: Re-authenticate or change the linked Google Photos Shared Album.
*   **Schedule**: Set "Do Not Disturb" hours for the Magic Frame (e.g., screen goes fully dark from 9 PM to 7 AM).
*   **Safety Limits**: Toggle features like "Auto-Abort on Silence" (how quickly the AI should back off if the patient doesn't respond).

## Technical Implementation Notes (Next.js)
*   **Framework**: Next.js App Router.
*   **Styling**: Tailwind CSS for responsive utility classes (ensuring the mobile view stacks elegantly, while the desktop view utilizes sidebars and wider grids).
*   **Components**: Use a component library like shadcn/ui or Radix UI for accessible, mobile-friendly forms, modals, and buttons.
*   **Audio Recording**: Leverage the standard Web Audio API (`MediaRecorder`) for capturing voice notes directly in the browser (works on both iOS Safari and Android Chrome).
