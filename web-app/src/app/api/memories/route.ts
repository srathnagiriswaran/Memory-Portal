import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    // Fetch memories that are marked as active (ready for Magic Frame)
    const snapshot = await adminDb.collection("memories")
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const memories = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ memories });
  } catch (error: any) {
    console.error("Fetch Memories Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch memories" },
      { status: 500 }
    );
  }
}
