import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getFamilyId, isDemoAccount } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const familyId = await getFamilyId(request);
    if (!familyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";

    const snapshot = await adminDb.collection("memories")
      .where("familyId", "==", familyId)
      .where("status", "==", status)
      .limit(50)
      .get();

    const memories = snapshot.docs
      .map((doc: any) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return NextResponse.json({ memories });
  } catch (error: any) {
    console.error("Fetch Memories Error:", error);
    if (error?.code === 5) {
      return NextResponse.json({ memories: [] });
    }
    return NextResponse.json(
      { error: error.message || "Failed to fetch memories" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const familyId = await getFamilyId(request);
    if (!familyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isDemoAccount(familyId)) {
      return NextResponse.json({ error: "Demo account is read-only" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Memory ID is required" }, { status: 400 });
    }

    // Verify ownership before deleting
    const docRef = adminDb.collection("memories").doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.familyId !== familyId) {
       return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await docRef.delete();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Memory Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete memory" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const familyId = await getFamilyId(request);
    if (!familyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isDemoAccount(familyId)) {
      return NextResponse.json({ error: "Demo account is read-only" }, { status: 403 });
    }

    const { id, learnedFacts } = await request.json();

    if (!id || !Array.isArray(learnedFacts)) {
      return NextResponse.json({ error: "Memory ID and learnedFacts array are required" }, { status: 400 });
    }

    // Verify ownership before updating
    const docRef = adminDb.collection("memories").doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.familyId !== familyId) {
       return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await docRef.update({
      learnedFacts
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update Memory Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update memory" },
      { status: 500 }
    );
  }
}

