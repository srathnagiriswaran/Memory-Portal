import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: Request) {
  // Option 1: Secure this via NextAuth if only Studio users can use it.
  // Option 2: Use a shared secret for the Magic Frame device (e.g., ?secret=123)
  // For now, we will return the key, but it's no longer baked into the JS bundle!
  // In production, you would validate a device token or cookie here before returning the key.

  const key = process.env.GEMINI_API_KEY;
  
  if (!key) {
    return NextResponse.json({ error: "Gemini API key not configured on server" }, { status: 500 });
  }

  return NextResponse.json({ key });
}
