import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key' });
    const { transcript, photoId, caretakerName } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
    }

    const prompt = `
      You are an expert at extracting useful, emotional, and factual memories from conversations with older adults.
      Below is a transcript or summary of a conversation between an AI companion and a senior looking at a family photo.
      Extract any newly discovered facts, memories, or strong emotional reactions that the family might want to know.
      Return the output as a JSON array of strings. Only return the JSON array, no markdown formatting.
      If there is nothing new or meaningful, return an empty array [].
      
      Transcript:
      ${transcript}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let newFacts = [];
    try {
      newFacts = JSON.parse(response.text || "[]");
    } catch (e) {
      // attempt to clean up markdown if present
      const cleanText = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "[]";
      newFacts = JSON.parse(cleanText);
    }

    if (newFacts.length > 0) {
      // Save to Firestore
      const harvestDoc = {
        photoId: photoId || "unknown",
        caretakerName: caretakerName || "Family",
        facts: newFacts,
        status: "pending_verification",
        createdAt: new Date().toISOString(),
      };
      await adminDb.collection("harvested_memories").add(harvestDoc);

      // Append directly to the memory document to complete the feedback loop
      if (photoId && photoId !== "unknown") {
        try {
          const memoryRef = adminDb.collection("memories").doc(photoId);
          const doc = await memoryRef.get();
          if (doc.exists) {
            const existingFacts = doc.data()?.learnedFacts || [];
            await memoryRef.update({
              learnedFacts: [...existingFacts, ...newFacts]
            });
          }
        } catch (e) {
          console.error("Failed to update original memory with learned facts:", e);
        }
      }
    }

    return NextResponse.json({ success: true, facts: newFacts });
  } catch (error: any) {
    console.error("Harvest Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
