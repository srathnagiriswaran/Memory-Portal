import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function verifyToken(token: string, secret: string): Promise<string | null> {
  try {
    const [b64Email, hash] = token.split("::");
    const email = atob(b64Email);
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(email));
    const expectedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
      
    if (hash === expectedHash) {
      return email;
    }
  } catch (e) {
    console.error("Token verification failed:", e);
  }
  return null;
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/gemini-live-proxy")) {
    const token = request.nextUrl.searchParams.get("token");
    const secret = process.env.FRAME_SECRET_KEY;
    
    if (!token || !secret) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const email = await verifyToken(token, secret);
    if (!email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return new NextResponse("Missing key", { status: 500 });
    }

    // Rewrite directly to the Google Generative Language WebSocket endpoint,
    // injecting the API key server-side. The GEMINI_API_KEY never leaves the server.
    // NextResponse.rewrite() is a transparent TCP pass-through: all WebSocket frames
    // (binary PCM audio, tool calls, interrupts) flow byte-for-byte without modification.
    const targetUrl = new URL("https://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent");
    targetUrl.searchParams.set("key", key);
    return NextResponse.rewrite(targetUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/api/gemini-live-proxy",
};
