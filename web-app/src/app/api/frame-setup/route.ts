import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(request: Request) {
  // Only authenticated Studio users (caregivers) can generate the setup link
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.FRAME_SECRET_KEY;
  
  if (!token) {
    return NextResponse.json({ error: "Frame secret key not configured on server" }, { status: 500 });
  }

  return NextResponse.json({ token });
}
