import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { generateFrameToken } from "@/lib/api-auth";

export async function GET(request: Request) {
  // Only authenticated Studio users (caregivers) can generate the setup link
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = generateFrameToken(session.user.email);
    return NextResponse.json({ token });
  } catch (err: any) {
    console.error("Frame setup error:", err);
    return NextResponse.json({ error: "Failed to generate frame token. Check server configuration." }, { status: 500 });
  }
}
