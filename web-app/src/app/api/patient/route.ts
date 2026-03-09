import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getFamilyId, isDemoAccount } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const familyId = await getFamilyId(request);
    if (!familyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doc = await adminDb.collection("settings").doc(`patient_profile_${familyId}`).get();
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
    const familyId = await getFamilyId(request);
    if (!familyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isDemoAccount(familyId)) {
      return NextResponse.json({ error: "Demo account is read-only" }, { status: 403 });
    }

    const { name } = await request.json();
    await adminDb.collection("settings").doc(`patient_profile_${familyId}`).set({ name, familyId }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save Patient Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
