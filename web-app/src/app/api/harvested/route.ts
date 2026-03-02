import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const familyId = session.user.email;

    const snapshot = await adminDb.collection("harvested_memories")
      .where("familyId", "==", familyId)
      .where("status", "==", "pending_verification")
      .limit(10)
      .get();

    const harvested = snapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return NextResponse.json({ harvested });
  } catch (error: any) {
    console.error("Fetch Harvested Memories Error:", error);
    if (error?.code === 5) {
      return NextResponse.json({ harvested: [] });
    }
    return NextResponse.json(
      { error: error.message || "Failed to fetch harvested memories" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const familyId = session.user.email;

    const { id, action, photoId, facts } = await request.json();
    
    if (!id || !action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const harvestedDocRef = adminDb.collection("harvested_memories").doc(id);
    const harvestedDoc = await harvestedDocRef.get();
    if (!harvestedDoc.exists || harvestedDoc.data()?.familyId !== familyId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const newStatus = action === 'verify' ? 'verified' : 'rejected';
    
    // If verifying, update the original memory with the accepted facts
    if (action === 'verify' && photoId && photoId !== "unknown" && facts && facts.length > 0) {
      const memoryRef = adminDb.collection("memories").doc(photoId);
      const doc = await memoryRef.get();
      if (doc.exists && doc.data()?.familyId === familyId) {
        const existingFacts = doc.data()?.learnedFacts || [];
        // Only add unique facts
        const combinedFacts = Array.from(new Set([...existingFacts, ...facts]));
        await memoryRef.update({
          learnedFacts: combinedFacts
        });
      }
    }
    
    await harvestedDocRef.update({
      status: newStatus,
      facts: facts || [], // Update with edited facts just in case
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, id, status: newStatus });
  } catch (error: any) {
    console.error("Update Harvested Memory Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update memory" },
      { status: 500 }
    );
  }
}
