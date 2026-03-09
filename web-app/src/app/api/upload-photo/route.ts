import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import crypto from "crypto";
import { getFamilyId, isDemoAccount } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const familyId = await getFamilyId(request);
    if (!familyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isDemoAccount(familyId)) {
      return NextResponse.json({ error: "Demo account is read-only" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("photo") as File;

    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "A valid image file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `photos/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const token = crypto.randomUUID();

    const bucket = adminStorage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const storageFile = bucket.file(fileName);

    await storageFile.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });

    const encodedName = encodeURIComponent(fileName);
    const photoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedName}?alt=media&token=${token}`;

    const docRef = adminDb.collection("memories").doc();
    await docRef.set({
      photoUrl,
      storagePath: fileName,
      caretakerEmail: session.user.email,
      caretakerName: session.user.name,
      familyId,
      createdAt: new Date().toISOString(),
      status: "pending_voice",
    });

    return NextResponse.json({ id: docRef.id, photoUrl });
  } catch (error: any) {
    console.error("Upload Photo Error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload photo" }, { status: 500 });
  }
}
