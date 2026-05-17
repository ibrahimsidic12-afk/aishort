/**
 * Job callback routing bridge
 */

import { processJob } from "@/lib/queue/workers";
import { logger } from "@/lib/utils/logger";

interface JobMessage {
  type: string;
  jobId: string;
  userId?: string;
  videoId?: string;
  clipId?: string;
  [key: string]: unknown;
}

/**
 * Handle an incoming job callback message and route it to the appropriate workflow
 */
export async function handleJobCallback(message: JobMessage): Promise<void> {
  const { type, jobId } = message;

  if (!type || !jobId) {
    throw new Error("Invalid job message: missing type or jobId");
  }

  logger.info("Processing job callback", { type, jobId });

  switch (type) {
    case "TRANSCRIPTION":
    case "CLIP_GENERATION":
    case "CLIP_RENDERING":
    case "THUMBNAIL_GENERATION":
    case "PUBLISH":
      // Delegate to the registered worker handler via processJob
      await processJob(message);
      break;

    default:
      logger.warn("Unknown job type received", { type, jobId });
      throw new Error(`Unknown job type: ${type}`);
  }
}
