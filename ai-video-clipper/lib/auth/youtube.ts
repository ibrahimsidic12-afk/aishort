/**
 * YouTube OAuth callback handler bridge
 */

import { exchangeCode, storeTokens } from "@/lib/youtube/oauth";

interface YouTubeOAuthResult {
  success: boolean;
  channelId?: string;
  error?: string;
}

/**
 * Handle the YouTube OAuth callback after user authorization
 */
export async function handleYouTubeOAuthCallback(
  userId: string,
  code: string,
  state: string,
): Promise<YouTubeOAuthResult> {
  try {
    // Exchange the authorization code for tokens
    const tokens = await exchangeCode(code);

    // Fetch channel info to get channelId
    const channelId = await fetchChannelId(tokens.accessToken);

    // Store the tokens (encrypted) in the database
    await storeTokens(userId, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      channelId,
    });

    return { success: true, channelId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Fetch the authenticated user's YouTube channel ID
 */
async function fetchChannelId(accessToken: string): Promise<string | undefined> {
  try {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) return undefined;

    const data = await response.json();
    return data.items?.[0]?.id;
  } catch {
    return undefined;
  }
}
