/**
 * YouTube publishing
 */

import { youtubeRequest } from "./client";
import { uploadToYouTube } from "./upload";
import { getFromR2 } from "@/lib/storage/r2";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

interface PublishOptions {
  title: string;
  description?: string;
  tags?: string[];
  visibility?: "public" | "private" | "unlisted";
  isShort?: boolean;
}

/**
 * Publish a clip to YouTube
 */
export async function publishToYouTube(
  userId: string,
  clipId: string,
  options: PublishOptions,
): Promise<{ videoId: string; url: string }> {
  const clip = await prisma.clip.findUnique({
    where: { id: clipId },
  });

  if (!clip || !clip.storageKey) {
    throw new Error("Clip not found or not rendered");
  }

  // Download clip from R2
  const r2Object = await getFromR2(clip.storageKey);
  const body = await r2Object.Body?.transformToByteArray();
  if (!body) throw new Error("Failed to download clip from storage");

  // Add #Shorts to description if it's a short
  const description = options.isShort
    ? `${options.description ?? ""}\n\n#Shorts`.trim()
    : options.description;

  // Upload to YouTube
  const videoId = await uploadToYouTube(userId, Buffer.from(body), {
    title: options.title,
    description,
    tags: options.tags,
    privacyStatus: options.visibility ?? "public",
  });

  const url = `https://youtube.com/watch?v=${videoId}`;
  logger.info("Published to YouTube", { clipId, videoId, url });

  return { videoId, url };
}

/**
 * Update an existing YouTube video's metadata
 */
export async function updateYouTubeVideo(
  userId: string,
  videoId: string,
  updates: { title?: string; description?: string; tags?: string[] },
) {
  await youtubeRequest(userId, "/videos?part=snippet", {
    method: "PUT",
    body: JSON.stringify({
      id: videoId,
      snippet: updates,
    }),
  });
}

/**
 * Delete a video from YouTube
 */
export async function deleteYouTubeVideo(userId: string, videoId: string) {
  await youtubeRequest(userId, `/videos?id=${videoId}`, {
    method: "DELETE",
  });
}
