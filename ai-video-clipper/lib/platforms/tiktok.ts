/**
 * TikTok platform publishing bridge
 */

import { publishToTikTok as tiktokUpload } from "@/lib/tiktok/upload";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

interface TikTokPublishOptions {
  title: string;
  privacyLevel?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
}

interface TikTokPublishResult {
  publishId: string;
  platform: "tiktok";
}

/**
 * Publish a clip to TikTok and record the publication
 */
export async function publishToTikTok(
  userId: string,
  clipId: string,
  options: TikTokPublishOptions,
): Promise<TikTokPublishResult> {
  // Publish using the TikTok upload module
  const result = await tiktokUpload(userId, clipId, options);

  // Record the publication in the database
  await prisma.publication.create({
    data: {
      clipId,
      platform: "TIKTOK",
      platformId: result.publishId,
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

  logger.info("Clip published to TikTok", { userId, clipId, publishId: result.publishId });

  return {
    publishId: result.publishId,
    platform: "tiktok",
  };
}
