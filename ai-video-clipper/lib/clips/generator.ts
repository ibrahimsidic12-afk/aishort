/**
 * Clip generation workflow bridge
 */

import { enqueueClipGeneration } from "@/lib/queue/enqueue";
import { prisma } from "@/lib/db/prisma";
import { hasCredits, deductCredits } from "@/lib/billing/credits";

interface RegenerateParams {
  videoId: string;
  userId: string;
  preferences?: {
    clipCount?: number;
    minDuration?: number;
    maxDuration?: number;
    style?: string;
    topics?: string[];
  };
}

interface RegenerateResult {
  jobId: string;
  videoId: string;
}

/**
 * Regenerate clips for a video using AI
 */
export async function regenerateClips(
  params: RegenerateParams,
): Promise<RegenerateResult> {
  const { videoId, userId, preferences } = params;

  // Verify the video exists and belongs to the user
  const video = await prisma.video.findFirst({
    where: { id: videoId, userId },
  });

  if (!video) {
    throw new Error("Video not found or access denied");
  }

  if (video.status !== "READY") {
    throw new Error("Video must be in READY status to generate clips");
  }

  // Check user has enough credits
  const creditCost = 1;
  const hasSufficientCredits = await hasCredits(userId, creditCost);
  if (!hasSufficientCredits) {
    throw new Error("Insufficient credits to regenerate clips");
  }

  // Deduct credits
  await deductCredits(userId, creditCost, `Clip regeneration for video ${videoId}`);

  // Enqueue the clip generation job
  const job = await enqueueClipGeneration(videoId, userId, preferences);

  return {
    jobId: job.id,
    videoId,
  };
}
