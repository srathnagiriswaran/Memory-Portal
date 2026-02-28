import { NextResponse } from "next/server";
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, action } = await request.json();
    
    if (!id || !action) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const newStatus = action === 'verify' ? 'verified' : 'rejected';
    
    await adminDb.collection("harvested_memories").doc(id).update({
      status: newStatus,
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
