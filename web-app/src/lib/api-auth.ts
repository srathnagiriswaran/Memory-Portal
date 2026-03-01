import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

/**
 * Checks if the request is authorized either via a NextAuth session (Caretaker)
 * or via a secure device token (Magic Frame).
 */
export async function isAuthorized(request: Request): Promise<boolean> {
  // 1. Check for NextAuth session (Studio User)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return true;
  }

  // 2. Check for Device Token (Magic Frame)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const expectedToken = process.env.FRAME_SECRET_KEY;
    
    // Only allow token auth if a token is actually configured on the server
    if (expectedToken && token === expectedToken) {
      return true;
    }
  }

  return false;
}
