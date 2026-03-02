import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/api-auth";

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.GEMINI_API_KEY;
  
  if (!key) {
    return NextResponse.json({ error: "Gemini API key not configured on server" }, { status: 500 });
  }

  return NextResponse.json({ key });
}
