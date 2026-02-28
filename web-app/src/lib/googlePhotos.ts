/**
 * Google Photos API Integration
 * Reference: https://developers.google.com/photos/library/reference/rest
 */

const API_BASE_URL = 'https://photoslibrary.googleapis.com/v1';

export interface MediaItem {
  id: string;
  productUrl: string;
  baseUrl: string;
  mimeType: string;
  mediaMetadata: {
    creationTime: string;
    width: string;
    height: string;
    photo?: {
      cameraMake?: string;
      cameraModel?: string;
    };
  };
  filename: string;
}

export interface SearchMediaItemsResponse {
  mediaItems: MediaItem[];
  nextPageToken?: string;
}

/**
 * Fetches media items from a specific shared album in Google Photos.
 * 
 * @param accessToken The OAuth2 access token with photoslibrary.readonly scope
 * @param albumId The ID of the shared album to fetch photos from
 * @param pageSize Maximum number of items to return (default 50)
 * @param pageToken Token for pagination
 * @returns Array of MediaItems and an optional nextPageToken
 */
export async function getAlbumPhotos(
  accessToken: string,
  albumId: string,
  pageSize: number = 50,
  pageToken?: string
): Promise<SearchMediaItemsResponse> {
  if (!accessToken) {
    throw new Error('Access token is required to fetch Google Photos');
  }

  if (!albumId) {
    throw new Error('Album ID is required');
  }

  const url = `${API_BASE_URL}/mediaItems:search`;
  
  const body: any = {
    albumId,
    pageSize: pageSize.toString(),
  };

  if (pageToken) {
    body.pageToken = pageToken;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    // Disable Next.js aggressive caching for this endpoint to ensure fresh photos
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Photos API Error:', errorText);
    throw new Error(`Failed to fetch photos: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    mediaItems: data.mediaItems || [],
    nextPageToken: data.nextPageToken,
  };
}
