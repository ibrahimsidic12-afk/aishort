/**
 * TikTok OAuth callback handler bridge
 */

import { exchangeCode, storeTokens, refreshAccessToken } from "@/lib/tiktok/oauth";
import { prisma } from "@/lib/db/prisma";
import { decrypt } from "@/lib/security/encryption";

interface TikTokOAuthResult {
  success: boolean;
  openId?: string;
  error?: string;
}

interface TikTokCredentials {
  accessToken: string;
  openId: string;
}

/**
 * Handle the TikTok OAuth callback after user authorization
 */
export async function handleTikTokOAuthCallback(
  userId: string,
  code: string,
  state: string,
): Promise<TikTokOAuthResult> {
  try {
    // Exchange the authorization code for tokens
    const tokens = await exchangeCode(code);

    // Store the tokens in the database
    await storeTokens(userId, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      openId: tokens.openId,
    });

    return { success: true, openId: tokens.openId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Get valid TikTok credentials for a user, refreshing if needed
 */
export async function getTikTokCredentials(
  userId: string,
): Promise<TikTokCredentials> {
  const token = await prisma.tikTokToken.findUnique({
    where: { userId },
  });

  if (!token) {
    throw new Error("TikTok account not connected");
  }

  // Check if token is expired or about to expire (5 min buffer)
  const isExpired = token.expiresAt < new Date(Date.now() + 5 * 60 * 1000);

  if (isExpired) {
    const decryptedRefresh = decrypt(token.refreshToken);
    const refreshed = await refreshAccessToken(decryptedRefresh);

    // Update stored tokens
    await storeTokens(userId, {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: refreshed.expiresAt,
      openId: token.openId,
    });

    return {
      accessToken: refreshed.accessToken,
      openId: token.openId,
    };
  }

  return {
    accessToken: decrypt(token.accessToken),
    openId: token.openId,
  };
}
