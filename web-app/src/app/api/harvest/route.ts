import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { adminDb } from "@/lib/firebase-admin";
import { isAuthorized } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key' });
    const { transcript, photoId, caretakerName, photoUrl } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
    }

    const prompt = `
      You are an expert at extracting useful, positive, and factual memories from conversations with older adults.
      Below is a transcript or summary of a conversation between an AI companion and a senior looking at a family photo.
      
      Task:
      1. Extract any newly discovered facts, happy memories, or positive emotional reactions that the family might want to know (as an array of strings). If there are none, return an empty array [].
      2. Provide a 1-2 sentence emotional summary of the conversation. How did the patient sound? Were they happy, nostalgic, confused?
      
      CRITICAL RULES FOR EXTRACTING FACTS:
      - DO NOT extract or store anything negative, distressing, or sad. We do not want to bring up negative memories in future conversations.
      - Focus ONLY on positive, neutral, or factual observations.
      - Ensure facts are grounded in the transcript. DO NOT hallucinate details.
      - Frame the facts in a way that is safe and pleasant to bring up later (e.g., "Loved remembering the trip to the beach").

      Return the output strictly as a JSON object with the following structure. Do NOT include markdown formatting or backticks.
      {
        "extractedFacts": ["fact 1", "fact 2"],
        "emotionalSummary": "summary here"
      }
      
      Transcript:
      ${transcript}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let result = { extractedFacts: [], emotionalSummary: "" };
    try {
      const cleanText = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}";
      result = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse Gemini output:", e);
    }

    if ((result.extractedFacts && result.extractedFacts.length > 0) || result.emotionalSummary) {
      // Save to Firestore
      const harvestDoc = {
        photoId: photoId || "unknown",
        photoUrl: photoUrl || "",
        caretakerName: caretakerName || "Family",
        facts: result.extractedFacts || [],
        emotionalSummary: result.emotionalSummary || "",
        status: "pending_verification",
        createdAt: new Date().toISOString(),
      };
      await adminDb.collection("harvested_memories").add(harvestDoc);
    }

    return NextResponse.json({ success: true, facts: result.extractedFacts, emotionalSummary: result.emotionalSummary });
  } catch (error: any) {
    console.error("Harvest Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
