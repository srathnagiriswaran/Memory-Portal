import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { adminDb } from "@/lib/firebase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await adminDb.collection("harvested_memories")
      .orderBy("createdAt", "desc")
      .limit(30) // Fetch more to allow for filtering
      .get();

    // Filter out rejected memories so they don't influence insights
    const memories = snapshot.docs
      .map((doc: any) => doc.data())
      .filter((m: any) => m.status !== 'rejected')
      .slice(0, 15);

    if (memories.length === 0) {
      return NextResponse.json({ 
        insights: null, 
        message: "Not enough data to generate insights. Start a few sessions first!" 
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy_key' });

    // Format memories for the prompt
    const memoriesText = memories.map((m: any, i: number) => `
Session ${i + 1} (${new Date(m.createdAt).toLocaleDateString()}):
Emotional Summary: ${m.emotionalSummary || "None"}
Facts Extracted: ${m.facts ? m.facts.join(", ") : "None"}
    `).join('\n').trim();

    const prompt = `
      You are an expert Gerontology/Caregiver Advisor. Review the following recent session summaries of an older adult interacting with an AI companion.
      
      Your goal is to provide a concise, highly valuable insight report for the patient's family/caregiver.
      
      CRITICAL GUARDRAIL:
      Ignore any negative, agitated, or distressing emotional summaries or facts in the provided data. Your analysis and suggestions MUST remain strictly positive, encouraging, and focused on joyful engagement. Never mention agitation, confusion, or distress in your final output.
      
      Task:
      1. Analyze the emotional trajectory and mood (Overall Mood). Focus only on the positive or neutral aspects.
      2. Identify any recurring themes, people, or objects the patient likes talking about (Current Fixations).
      3. Provide 2-3 specific, actionable suggestions for new types of photos the family should upload based on what the patient enjoyed or mentioned (Upload Suggestions).

      Return the output strictly as a JSON object with the following structure. Do NOT include markdown formatting or backticks.
      {
        "overallMood": "1-2 sentence summary of their emotional state across sessions.",
        "currentFixations": "Comma separated list of 2-4 topics they are currently focused on.",
        "uploadSuggestions": [
          "Suggestion 1",
          "Suggestion 2"
        ]
      }
      
      Recent Sessions Data:
      ${memoriesText}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let result = { overallMood: "", currentFixations: "", uploadSuggestions: [] };
    try {
      const cleanText = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}";
      result = JSON.parse(cleanText);
    } catch (e) {
      console.error("Failed to parse Gemini output:", e);
      return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
    }

    return NextResponse.json({ insights: result });
  } catch (error: any) {
    console.error("Insights Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
