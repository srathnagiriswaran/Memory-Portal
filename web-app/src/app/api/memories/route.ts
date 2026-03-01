import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { isAuthorized } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "active";

    const snapshot = await adminDb.collection("memories")
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
