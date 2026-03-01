import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memoryId, transcription } = await request.json();

    if (!memoryId || !transcription) {
      return NextResponse.json({ error: "Missing required fields (memoryId, transcription)" }, { status: 400 });
    }

    await adminDb.collection("memories").doc(memoryId).update({
      transcription,
      status: "active",
    });

    return NextResponse.json({ success: true, transcription });
  } catch (error: any) {
    console.error("Upload Text Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process text" },
      { status: 500 }
    );
  }
}
