/**
 * Clip publishing workflow bridge
 */

import { enqueuePublish } from "@/lib/queue/enqueue";
import { prisma } from "@/lib/db/prisma";

type Platform = "youtube" | "tiktok";

interface PublishOptions {
  title: string;
  description?: string;
  tags?: string[];
  visibility?: "public" | "private" | "unlisted";
  isShort?: boolean;
}

interface PublishResult {
  jobId: string;
  platform: Platform;
  clipId: string;
}

/**
 * Publish a clip to a platform by enqueueing the publishing job
 */
export async function publishClip(
  clipId: string,
  platform: Platform,
  options: PublishOptions,
): Promise<PublishResult> {
  const clip = await prisma.clip.findUnique({
    where: { id: clipId },
    select: { id: true, userId: true, status: true, storageKey: true },
  });

  if (!clip) {
    throw new Error(`Clip not found: ${clipId}`);
  }

  if (!clip.storageKey) {
    throw new Error("Clip has not been rendered yet");
  }

  // Store publish options in clip metadata for the worker to use
  await prisma.clip.update({
    where: { id: clipId },
    data: {
      publishOptions: {
        platform,
        ...options,
      } as any,
    },
  });

  // Enqueue the publish job
  const job = await enqueuePublish(clipId, clip.userId, platform);

  return {
    jobId: job.id,
    platform,
    clipId,
  };
}
