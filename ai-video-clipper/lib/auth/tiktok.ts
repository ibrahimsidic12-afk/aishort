export async function handleTikTokOAuthCallback(
  _userId: string,
  _code: string,
  _state: string
): Promise<{ success: boolean }> {
  console.warn("[TIKTOK_AUTH] handleTikTokOAuthCallback: stub");
  return { success: false };
}

export async function getTikTokCredentials(
  _userId: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  console.warn("[TIKTOK] getTikTokCredentials: stub");
  throw new Error("TikTok credentials not configured");
}
