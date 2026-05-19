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

    // Run transcription if that's the job type
    if (payload.type === "TRANSCRIPTION" && payload.videoId) {
      await runTranscription(payload.videoId);
    }

    if (payload.jobId) {
      await prisma.job.update({
        where: { id: payload.jobId },
        data: { status: "COMPLETED", progress: 100, completedAt: new Date() },
      });
    }

    // Update video status based on job type
    if (payload.type === "TRANSCRIPTION" && payload.videoId) {
      await prisma.video.update({
        where: { id: payload.videoId },
        data: { status: "READY" },
      });
      console.log(`[Queue] Video marked READY: ${payload.videoId}`);
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
    // Mark video as error if transcription failed
    if (payload.type === "TRANSCRIPTION" && payload.videoId) {
      await prisma.video.update({
        where: { id: payload.videoId },
        data: { status: "ERROR" },
      });
    }
  }
}

/**
 * Run Deepgram transcription on a video
 */
async function runTranscription(videoId: string): Promise<void> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY not configured");
  }

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video || !video.storageUrl) {
    throw new Error("Video or storage URL not found");
  }

  // Update video status
  await prisma.video.update({
    where: { id: videoId },
    data: { status: "TRANSCRIBING" },
  });

  // Call Deepgram API directly (REST)
  const response = await fetch("https://api.deepgram.com/v1/listen?punctuate=true&smart_format=true&language=en&model=nova-2", {
    method: "POST",
    headers: {
      "Authorization": `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: video.storageUrl }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Deepgram API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const results = data?.results;
  const channels = results?.channels?.[0];
  const alternatives = channels?.alternatives?.[0];

  if (!alternatives) {
    throw new Error("No transcription results returned from Deepgram");
  }

  const fullText = alternatives.transcript || "";
  const words = alternatives.words || [];
  const duration = data?.metadata?.duration || video.duration || 0;

  // Build segments from words (group into ~5 second chunks)
  const segments: Array<{ start: number; end: number; text: string; confidence: number }> = [];
  let currentSegment = { start: 0, end: 0, text: "", confidence: 0, wordCount: 0 };

  for (const word of words) {
    if (currentSegment.wordCount === 0) {
      currentSegment.start = word.start;
    }
    currentSegment.end = word.end;
    currentSegment.text += (currentSegment.text ? " " : "") + word.punctuated_word || word.word;
    currentSegment.confidence += word.confidence || 0.9;
    currentSegment.wordCount++;

    // Split every ~10 words or at sentence boundaries
    const endsWithPunct = /[.!?]$/.test(currentSegment.text);
    if (currentSegment.wordCount >= 10 || endsWithPunct) {
      segments.push({
        start: currentSegment.start,
        end: currentSegment.end,
        text: currentSegment.text.trim(),
        confidence: currentSegment.confidence / currentSegment.wordCount,
      });
      currentSegment = { start: 0, end: 0, text: "", confidence: 0, wordCount: 0 };
    }
  }

  // Push remaining words
  if (currentSegment.wordCount > 0) {
    segments.push({
      start: currentSegment.start,
      end: currentSegment.end,
      text: currentSegment.text.trim(),
      confidence: currentSegment.confidence / currentSegment.wordCount,
    });
  }

  // Save transcript to DB
  await prisma.transcript.upsert({
    where: { videoId },
    create: {
      videoId,
      content: fullText,
      segments: segments as any,
      language: "en",
      provider: "DEEPGRAM",
    },
    update: {
      content: fullText,
      segments: segments as any,
      language: "en",
    },
  });

  // Update video duration if we got it
  if (duration > 0) {
    await prisma.video.update({
      where: { id: videoId },
      data: { duration },
    });
  }

  console.log(`[Queue] Transcription complete: ${segments.length} segments, ${Math.round(duration)}s`);
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
