import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getFamilyId, isDemoAccount } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    const familyId = await getFamilyId(request);
    if (!familyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await adminDb.collection("family_graph")
      .where("familyId", "==", familyId)
      .get();
      
    const members = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ members });
  } catch (error: any) {
    console.error("Fetch Family Graph Error:", error);
    if (error?.code === 5) {
      // Not found / no permission in dev
      return NextResponse.json({ members: [] });
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

    const { name, relationship, details } = await request.json();
    if (!name || !relationship) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const docRef = await adminDb.collection("family_graph").add({
      name,
      relationship,
      details: details || "",
      familyId,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error("Add Family Member Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const docRef = adminDb.collection("family_graph").doc(id);
    const doc = await docRef.get();
    if (!doc.exists || doc.data()?.familyId !== familyId) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
