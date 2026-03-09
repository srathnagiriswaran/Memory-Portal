import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getFamilyId, isDemoAccount } from "@/lib/api-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const familyId = await getFamilyId(request);

    // Only allow the primary caregiver or people already in the family to view invites
    // Actually, getFamilyId handles this transparently.
    const snapshot = await adminDb
      .collection("caregiver_invites")
      .where("primaryEmail", "==", familyId)
      .get();

    const invites = snapshot.docs.map((doc: any) => ({
      email: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ invites });
  } catch (error: any) {
    console.error("Fetch Invites Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch invites" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const familyId = await getFamilyId(request);
    if (familyId && isDemoAccount(familyId)) {
      return NextResponse.json({ error: "Demo account is read-only" }, { status: 403 });
    }

    // Only the true primary caregiver can invite others
    if (familyId !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Only the primary caregiver can invite others" },
        { status: 403 }
      );
    }

    const { email, role = "admin" } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const targetEmail = email.toLowerCase().trim();
    
    if (targetEmail === familyId) {
      return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
    }

    await adminDb.collection("caregiver_invites").doc(targetEmail).set({
      primaryEmail: familyId,
      role,
      invitedAt: new Date().toISOString(),
      invitedBy: session.user.email,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Create Invite Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invite" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const familyId = await getFamilyId(request);
    if (familyId && isDemoAccount(familyId)) {
      return NextResponse.json({ error: "Demo account is read-only" }, { status: 403 });
    }

    // Only the true primary caregiver can remove invites
    if (familyId !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Only the primary caregiver can manage invites" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await adminDb.collection("caregiver_invites").doc(email.toLowerCase()).delete();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete Invite Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete invite" },
      { status: 500 }
    );
  }
}
