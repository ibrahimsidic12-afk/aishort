/**
 * YouTube API client
 */

import { prisma } from "@/lib/db/prisma";
import { decrypt } from "@/lib/security/encryption";
import { refreshAccessToken } from "./oauth";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Get a valid access token for a user (auto-refreshes if expired)
 */
export async function getAccessToken(userId: string): Promise<string> {
  const tokens = await prisma.youTubeToken.findUnique({
    where: { userId },
  });

  if (!tokens) {
    throw new Error("YouTube not connected. Please authorize in settings.");
  }

  const accessToken = decrypt(tokens.accessToken);
  const refreshToken = decrypt(tokens.refreshToken);

  // Check if token is expired (with 5 min buffer)
  if (tokens.expiresAt.getTime() < Date.now() + 5 * 60 * 1000) {
    const refreshed = await refreshAccessToken(refreshToken);

    await prisma.youTubeToken.update({
      where: { userId },
      data: {
        accessToken: refreshed.accessToken,
        expiresAt: refreshed.expiresAt,
      },
    });

    return refreshed.accessToken;
  }

  return accessToken;
}

/**
 * Make an authenticated request to the YouTube API
 */
export async function youtubeRequest(
  userId: string,
  endpoint: string,
  options?: RequestInit,
): Promise<Response> {
  const token = await getAccessToken(userId);

  const response = await fetch(`${YOUTUBE_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube API error (${response.status}): ${error}`);
  }

  return response;
}

/**
 * Get the authenticated user's channel info
 */
export async function getChannelInfo(userId: string) {
  const response = await youtubeRequest(
    userId,
    "/channels?part=snippet,statistics&mine=true",
  );
  const data = await response.json();
  return data.items?.[0] ?? null;
}

/**
 * Check if YouTube is connected for a user
 */
export async function isYouTubeConnected(userId: string): Promise<boolean> {
  const tokens = await prisma.youTubeToken.findUnique({
    where: { userId },
    select: { id: true },
  });
  return !!tokens;
}
