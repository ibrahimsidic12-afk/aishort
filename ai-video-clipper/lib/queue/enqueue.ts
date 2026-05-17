/**
 * Job enqueue helpers
 */

import { publishMessage } from "./qstash";
import { prisma } from "@/lib/db/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function enqueueTranscription(videoId: string, userId: string) {
  const job = await prisma.job.create({
    data: {
      userId,
      videoId,
      type: "TRANSCRIPTION",
      status: "QUEUED",
    },
  });

  await publishMessage(`${BASE_URL}/api/webhooks/qstash`, {
    type: "TRANSCRIPTION",
    jobId: job.id,
    videoId,
    userId,
  });

  return job;
}

export async function enqueueClipGeneration(videoId: string, userId: string, preferences?: Record<string, unknown>) {
  const job = await prisma.job.create({
    data: {
      userId,
      videoId,
      type: "CLIP_GENERATION",
      status: "QUEUED",
    },
  });

  await publishMessage(`${BASE_URL}/api/webhooks/qstash`, {
    type: "CLIP_GENERATION",
    jobId: job.id,
    videoId,
    userId,
    preferences,
  });

  return job;
}

export async function enqueueClipRendering(clipId: string, userId: string, settings?: Record<string, unknown>) {
  const job = await prisma.job.create({
    data: {
      userId,
      type: "CLIP_RENDERING",
      status: "QUEUED",
    },
  });

  await publishMessage(`${BASE_URL}/api/webhooks/qstash`, {
    type: "CLIP_RENDERING",
    jobId: job.id,
    clipId,
    userId,
    settings,
  });

  return job;
}

export async function enqueueThumbnailGeneration(clipId: string, userId: string) {
  const job = await prisma.job.create({
    data: {
      userId,
      type: "THUMBNAIL_GENERATION",
      status: "QUEUED",
    },
  });

  await publishMessage(`${BASE_URL}/api/webhooks/qstash`, {
    type: "THUMBNAIL_GENERATION",
    jobId: job.id,
    clipId,
    userId,
  });

  return job;
}

export async function enqueuePublish(clipId: string, userId: string, platform: string) {
  const job = await prisma.job.create({
    data: {
      userId,
      type: "PUBLISH",
      status: "QUEUED",
    },
  });

  await publishMessage(`${BASE_URL}/api/webhooks/qstash`, {
    type: "PUBLISH",
    jobId: job.id,
    clipId,
    userId,
    platform,
  });

  return job;
}
