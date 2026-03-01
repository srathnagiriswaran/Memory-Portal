import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { isAuthorized } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await adminDb.collection("family_graph").get();
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
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, relationship, details } = await request.json();
    if (!name || !relationship) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const docRef = await adminDb.collection("family_graph").add({
      name,
      relationship,
      details: details || "",
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
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await adminDb.collection("family_graph").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
