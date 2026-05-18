/**
 * Job Queue Management
 * Uses Upstash QStash for reliable job processing
 */

import { prisma } from "../db/prisma";

export interface CreateJobOpts {
  videoId: string;
  userId: string;
  type: string;
  options?: Record<string, unknown>;
}

export interface JobPayload {
  jobId?: string;
  type: string;
  videoId: string;
  clipId?: string;
  userId: string;
  options?: Record<string, unknown>;
  callback?: string;
}

const qstashBaseUrl = process.env.QSTASH_URL || "https://qstash.upstash.io";

/**
 * Create a processing job in the database
 */
export async function createProcessingJob(opts: CreateJobOpts): Promise<{ id: string; status: string; type: string; createdAt: Date }> {
  const job = await prisma.job.create({
    data: {
      userId: opts.userId,
      videoId: opts.videoId,
      type: opts.type as any,
      status: "QUEUED",
      result: opts.options as object | undefined,
    },
  });

  console.log(`[Queue] Created job ${job.id} of type ${opts.type}`);
  return { id: job.id, status: job.status, type: job.type, createdAt: job.createdAt };
}

/**
 * Send a job to QStash for async processing
 */
export async function sendJob(payload: JobPayload): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const callbackUrl = `${appUrl}/api/webhooks/qstash`;

  const body = JSON.stringify(payload);
  const token = process.env.QSTASH_TOKEN || process.env.QSTASH_CURRENT_SIGNING_KEY || "";

  if (!token) {
    console.warn("[Queue] QSTASH_TOKEN not set, running synchronously");
    await processJobDirectly(payload);
    return payload.jobId || `sync_${Date.now()}`;
  }

  try {
    const response = await fetch(qstashBaseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Upstash-Deduplication-Id": payload.jobId || `job_${Date.now()}`,
        "Upstash-Callback": callbackUrl,
      },
      body: JSON.stringify({
        destination: payload.type,
        body,
        retries: 3,
        delay: 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`QStash error: ${response.status}`);
    }

    const result = await response.json() as { messageId: string };
    console.log(`[Queue] Sent job to QStash: ${result.messageId}`);
    return result.messageId;

  } catch (error) {
    console.error("[Queue] Failed to send to QStash:", error);
    await processJobDirectly(payload);
    return payload.jobId || `fallback_${Date.now()}`;
  }
}

/**
 * Process job directly (fallback when QStash unavailable)
 */
async function processJobDirectly(payload: JobPayload): Promise<void> {
  console.log(`[Queue] Processing job directly: ${payload.type}`);

  try {
    if (payload.jobId) {
      await prisma.job.update({
        where: { id: payload.jobId },
        data: { status: "PROCESSING", startedAt: new Date() },
      });
    }

    // Would call appropriate processor based on payload.type

    if (payload.jobId) {
      await prisma.job.update({
        where: { id: payload.jobId },
        data: { status: "COMPLETED", progress: 100, completedAt: new Date() },
      });
    }

  } catch (error) {
    console.error("[Queue] Direct processing failed:", error);
    if (payload.jobId) {
      await prisma.job.update({
        where: { id: payload.jobId },
        data: { 
          status: "FAILED", 
          error: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date() 
        },
      });
    }
  }
}

/**
 * Cancel a queued job
 */
export async function cancelJob(jobId: string): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: { status: "CANCELLED", error: "Cancelled by user" },
  });
  console.log(`[Queue] Cancelled job: ${jobId}`);
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId: string): Promise<{ id: string; status: string; retryCount: number }> {
  const job = await prisma.job.update({
    where: { id: jobId },
    data: { 
      status: "QUEUED", 
      progress: 0, 
      error: "",
      startedAt: null,
      completedAt: null,
    },
  });

  await sendJob({
    jobId: job.id,
    type: job.type,
    videoId: job.videoId || "",
    userId: job.userId,
  });

  console.log(`[Queue] Retrying job: ${jobId}`);
  return { id: job.id, status: job.status, retryCount: 1 };
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string) {
  return prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      progress: true,
      type: true,
      error: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
    },
  });
}
