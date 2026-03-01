import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const doc = await adminDb.collection("settings").doc("patient_profile").get();
    if (doc.exists) {
      return NextResponse.json(doc.data());
    }
    return NextResponse.json({ name: "" });
  } catch (error: any) {
    console.error("Fetch Patient Error:", error);
    if (error?.code === 5) {
      return NextResponse.json({ name: "" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    await adminDb.collection("settings").doc("patient_profile").set({ name }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save Patient Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
