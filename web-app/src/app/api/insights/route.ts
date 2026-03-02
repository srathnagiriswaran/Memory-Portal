import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { adminDb } from "@/lib/firebase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getFamilyId } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const familyId = await getFamilyId(request);
    if (!familyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const checkOnly = searchParams.get("check") === "true";

    // Removed .orderBy("createdAt", "desc") to avoid requiring a composite index in Firestore
    const snapshot = await adminDb.collection("harvested_memories")
      .where("familyId", "==", familyId)
      .limit(100) // Fetch up to 100 to sort in memory
      .get();

    // Sort by createdAt descending in memory
    const sortedDocs = snapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    // Filter out rejected memories so they don't influence insights
    const allValidMemories = sortedDocs.filter((m: any) => m.status !== 'rejected');

    if (checkOnly) {
      return NextResponse.json({ 
        totalValidSessions: allValidMemories.length,
        latestMemoryId: allValidMemories.length > 0 ? allValidMemories[0].id : null
      });
    }

    const memories = allValidMemories.slice(0, 15);

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

    return NextResponse.json({ 
      insights: result,
      metadata: {
        totalValidSessions: allValidMemories.length,
        latestMemoryId: allValidMemories.length > 0 ? allValidMemories[0].id : null
      }
    });
  } catch (error: any) {
    console.error("Insights Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
