import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";

/**
 * Generates a signed token for the Magic Frame device, encoding the familyId (email).
 */
export function generateFrameToken(email: string): string {
  const secret = process.env.FRAME_SECRET_KEY;
  if (!secret) throw new Error("FRAME_SECRET_KEY not set");
  const hash = crypto.createHmac("sha256", secret).update(email).digest("hex");
  return `${Buffer.from(email).toString('base64')}::${hash}`;
}

/**
 * Checks if the request is authorized either via a NextAuth session (Caretaker)
 * or via a secure device token (Magic Frame).
 * Returns the familyId (primary email) if authorized, or null if not.
 */
export async function getFamilyId(request: Request): Promise<string | null> {
  // 1. Check for NextAuth session (Studio User)
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const email = session.user.email.toLowerCase();
    
    // Check if this user was invited by a primary caregiver
    try {
      const inviteDoc = await adminDb.collection("caregiver_invites").doc(email).get();
      if (inviteDoc.exists) {
        return inviteDoc.data()?.primaryEmail || email;
      }
    } catch (err) {
      console.error("Failed to check caregiver invites:", err);
    }
    
    // If not invited to another family, they are their own primary caregiver
    return email;
  }

  // 2. Check for Device Token (Magic Frame)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const secret = process.env.FRAME_SECRET_KEY;
    
    if (secret && token.includes("::")) {
      const [b64Email, hash] = token.split("::");
      try {
        const email = Buffer.from(b64Email, 'base64').toString('utf-8');
        const expectedHash = crypto.createHmac("sha256", secret).update(email).digest("hex");
        if (hash === expectedHash) {
          return email; // Validated
        }
      } catch (e) {
        // Invalid token format
      }
    } else if (secret && token === secret) {
        // For backwards compatibility during transition, we could allow the raw secret, 
        // but since we want to fix IDOR immediately, we must require the new token format
        // that embeds the familyId. If someone uses the old token, they get Unauthorized.
        console.warn("Attempted to use legacy un-scoped FRAME_SECRET_KEY. Denied.");
    }
  }

  return null;
}

export async function isAuthorized(request: Request): Promise<boolean> {
  const familyId = await getFamilyId(request);
  return familyId !== null;
}
