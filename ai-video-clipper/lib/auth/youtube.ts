export async function getYouTubeCredentials(
  _userId: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date; channelId?: string }> {
  console.warn("[YOUTUBE] getYouTubeCredentials: stub");
  throw new Error("YouTube credentials not configured");
}

export async function handleYouTubeOAuthCallback(
  _userId: string,
  _code: string,
  _state: string
): Promise<{ success: boolean }> {
  console.warn("[YOUTUBE_AUTH] handleYouTubeOAuthCallback: stub");
  return { success: false };
}
