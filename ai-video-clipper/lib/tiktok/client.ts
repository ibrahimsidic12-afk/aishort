/**
 * TikTok API client
 */

import { prisma } from "@/lib/db/prisma";
import { decrypt } from "@/lib/security/encryption";
import { refreshAccessToken } from "./oauth";

const TIKTOK_API_BASE = "https://open.tiktokapis.com/v2";

/**
 * Get a valid access token for a user (auto-refreshes if expired)
 */
export async function getAccessToken(userId: string): Promise<string> {
  const tokens = await prisma.tikTokToken.findUnique({
    where: { userId },
  });

  if (!tokens) {
    throw new Error("TikTok not connected. Please authorize in settings.");
  }

  const accessToken = decrypt(tokens.accessToken);
  const refreshToken = decrypt(tokens.refreshToken);

  // Check if token is expired (with 5 min buffer)
  if (tokens.expiresAt.getTime() < Date.now() + 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(refreshToken);

    await prisma.tikTokToken.update({
      where: { userId },
      data: {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt,
      },
    });

    return refreshed.accessToken;
  }

  return accessToken;
}

/**
 * Make an authenticated request to the TikTok API
 */
export async function tiktokRequest(
  userId: string,
  endpoint: string,
  options?: RequestInit,
): Promise<Response> {
  const token = await getAccessToken(userId);

  const response = await fetch(`${TIKTOK_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TikTok API error (${response.status}): ${error}`);
  }

  return response;
}

/**
 * Check if TikTok is connected for a user
 */
export async function isTikTokConnected(userId: string): Promise<boolean> {
  const tokens = await prisma.tikTokToken.findUnique({
    where: { userId },
    select: { id: true },
  });
  return !!tokens;
}
