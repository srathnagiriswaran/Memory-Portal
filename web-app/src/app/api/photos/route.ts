import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { getAlbumPhotos } from "@/lib/googlePhotos";

export async function GET(request: Request) {
  try {
    // We need to use the auth options we defined to get the access token
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore - We added accessToken in the NextAuth callbacks
    const accessToken = session.accessToken as string;
    
    if (!accessToken) {
      return NextResponse.json({ error: "No Google access token found" }, { status: 401 });
    }

    const albumId = process.env.GOOGLE_PHOTOS_ALBUM_ID;
    
    if (!albumId) {
      // Return empty array if no album configured yet, so the UI doesn't crash
      console.warn("GOOGLE_PHOTOS_ALBUM_ID is not set in environment variables");
      return NextResponse.json({ mediaItems: [] });
    }

    // Parse URL parameters for pagination
    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get('pageToken') || undefined;
    
    const photosData = await getAlbumPhotos(accessToken, albumId, 20, pageToken);
    
    return NextResponse.json(photosData);
  } catch (error: any) {
    console.error("Photos API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch photos" },
      { status: 500 }
    );
  }
}
