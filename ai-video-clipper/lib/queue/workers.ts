/**
 * Worker registration and processing
 */

import { Receiver } from "@upstash/qstash";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

/**
 * Verify QStash webhook signature
 */
export async function verifyQStashSignature(
  body: string,
  signature: string,
): Promise<boolean> {
  try {
    await receiver.verify({ body, signature });
    return true;
  } catch {
    return false;
  }
}

interface JobMessage {
  type: string;
  jobId: string;
  [key: string]: unknown;
}

type JobHandler = (message: JobMessage) => Promise<unknown>;

const handlers: Record<string, JobHandler> = {};

/**
 * Register a job handler
 */
export function registerHandler(type: string, handler: JobHandler) {
  handlers[type] = handler;
}

/**
 * Process an incoming job message
 */
export async function processJob(message: JobMessage) {
  const { type, jobId } = message;

  const handler = handlers[type];
  if (!handler) {
    logger.error(`No handler registered for job type: ${type}`);
    return;
  }

  // Mark job as processing
  await prisma.job.update({
    where: { id: jobId },
    data: { status: "PROCESSING", startedAt: new Date() },
  });

  try {
    const result = await handler(message);

    // Mark job as completed
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        progress: 100,
        result: result as any,
      },
    });

    logger.info(`Job completed: ${type}`, { jobId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: errorMessage,
        completedAt: new Date(),
      },
    });

    logger.error(`Job failed: ${type}`, { jobId, error: errorMessage });
    throw error;
  }
}
