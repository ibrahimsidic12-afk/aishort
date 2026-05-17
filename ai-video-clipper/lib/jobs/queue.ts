/**
 * Job queue management bridge
 */

import { prisma } from "@/lib/db/prisma";
import { publishMessage } from "@/lib/queue/qstash";
import { logger } from "@/lib/utils/logger";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface CreateJobParams {
  userId: string;
  videoId?: string;
  type: string;
  payload?: Record<string, unknown>;
}

/**
 * Cancel a queued or processing job
 */
export async function cancelJob(jobId: string, userId: string): Promise<void> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId },
  });

  if (!job) {
    throw new Error("Job not found or access denied");
  }

  if (job.status === "COMPLETED" || job.status === "CANCELLED") {
    throw new Error(`Cannot cancel job in ${job.status} status`);
  }

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: "CANCELLED",
      completedAt: new Date(),
    },
  });

  logger.info("Job cancelled", { jobId, userId });
}

/**
 * Create a new processing job and enqueue it
 */
export async function createProcessingJob(
  params: CreateJobParams,
): Promise<{ jobId: string }> {
  const { userId, videoId, type, payload } = params;

  const job = await prisma.job.create({
    data: {
      userId,
      videoId,
      type,
      status: "QUEUED",
    },
  });

  await publishMessage(`${BASE_URL}/api/webhooks/qstash`, {
    type,
    jobId: job.id,
    userId,
    videoId,
    ...payload,
  });

  logger.info("Processing job created", { jobId: job.id, type, userId });

  return { jobId: job.id };
}

/**
 * Retry a failed job by creating a new job with the same parameters
 */
export async function retryJob(jobId: string, userId: string): Promise<{ newJobId: string }> {
  const originalJob = await prisma.job.findFirst({
    where: { id: jobId, userId },
  });

  if (!originalJob) {
    throw new Error("Job not found or access denied");
  }

  if (originalJob.status !== "FAILED") {
    throw new Error("Only failed jobs can be retried");
  }

  // Create a new job with the same parameters
  const newJob = await prisma.job.create({
    data: {
      userId: originalJob.userId,
      videoId: originalJob.videoId,
      type: originalJob.type,
      status: "QUEUED",
    },
  });

  // Re-enqueue with original type
  await publishMessage(`${BASE_URL}/api/webhooks/qstash`, {
    type: originalJob.type,
    jobId: newJob.id,
    userId: originalJob.userId,
    videoId: originalJob.videoId,
  });

  logger.info("Job retried", { originalJobId: jobId, newJobId: newJob.id });

  return { newJobId: newJob.id };
}
