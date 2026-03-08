import { NextResponse } from "next/server";
import { generateFrameToken } from "@/lib/api-auth";

/**
 * Public endpoint — no auth required.
 * Generates a one-time scoped frame token for the demo account so the
 * Magic Frame can be launched directly from the landing page without
 * requiring the visitor to sign into the Caretaker Studio first.
 *
 * The token is HMAC-signed and scoped to the demo email — it only grants
 * access to demo data. No session is created. Nothing is stored.
 */
export async function GET() {
  const demoEmail = process.env.DEMO_ACCOUNT_EMAIL || "demo@memoryportal.com";

  try {
    const token = generateFrameToken(demoEmail);
    return NextResponse.json({ token });
  } catch (err: any) {
    console.error("Demo launch error:", err);
    return NextResponse.json(
      { error: "Demo is temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }
}
