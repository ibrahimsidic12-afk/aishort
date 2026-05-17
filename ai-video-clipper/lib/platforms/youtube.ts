/**
 * YouTube platform publishing bridge
 */

import { publishToYouTube as youtubePublish } from "@/lib/youtube/publish";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

interface YouTubeUploadOptions {
  title: string;
  description?: string;
  tags?: string[];
  visibility?: "public" | "private" | "unlisted";
  isShort?: boolean;
}

interface YouTubePublishResult {
  videoId: string;
  url: string;
  platform: "youtube";
}

/**
 * Upload a clip to YouTube (unlisted by default for review)
 */
export async function uploadToYouTube(
  userId: string,
  clipId: string,
  options: YouTubeUploadOptions,
): Promise<YouTubePublishResult> {
  const result = await youtubePublish(userId, clipId, {
    ...options,
    visibility: options.visibility ?? "unlisted",
  });

  // Record the publication in the database
  await prisma.publication.create({
    data: {
      clipId,
      platform: "YOUTUBE",
      platformId: result.videoId,
      platformUrl: result.url,
      status: "UPLOADED",
      publishedAt: new Date(),
    },
  });

  logger.info("Clip uploaded to YouTube", { userId, clipId, videoId: result.videoId });

  return {
    videoId: result.videoId,
    url: result.url,
    platform: "youtube",
  };
}

/**
 * Publish a clip to YouTube (public visibility)
 */
export async function publishYouTubeVideo(
  userId: string,
  clipId: string,
  options: YouTubeUploadOptions,
): Promise<YouTubePublishResult> {
  const result = await youtubePublish(userId, clipId, {
    ...options,
    visibility: "public",
  });

  // Record the publication in the database
  await prisma.publication.create({
    data: {
      clipId,
      platform: "YOUTUBE",
      platformId: result.videoId,
      platformUrl: result.url,
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  // Update clip status
  await prisma.clip.update({
    where: { id: clipId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  logger.info("Clip published to YouTube", { userId, clipId, videoId: result.videoId });

  return {
    videoId: result.videoId,
    url: result.url,
    platform: "youtube",
  };
}
