/**
 * Transcription Workflow
 * Handles the full transcription pipeline:
 * 1. Get video and prepare audio
 * 2. Chunk for long videos
 * 3. Transcribe with Deepgram
 * 4. Process and store results
 */

import { prisma } from "@/lib/db/prisma";
import { transcribeWithWhisper } from "../../workers/transcription-worker/whisper";

interface TranscriptionWorkflowInput {
  videoId: string;
  userId: string;
  provider?: "WHISPER" | "DEEPGRAM" | "ASSEMBLYAI";
}

export async function runTranscriptionWorkflow(input: TranscriptionWorkflowInput) {
  const { videoId, userId, provider = "DEEPGRAM" } = input;

  console.log(`[Transcription Workflow] Starting for video ${videoId}`);

  // Step 1: Get video info
  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video) {
    throw new Error(`Video not found: ${videoId}`);
  }

  // Update video status
  await prisma.video.update({
    where: { id: videoId },
    data: { status: "TRANSCRIBING" },
  });

  // Create job
  const job = await prisma.job.create({
    data: {
      userId,
      videoId,
      type: "TRANSCRIPTION",
      status: "PROCESSING",
      startedAt: new Date(),
    },
  });

  try {
    // Step 2: Get audio URL from storage
    const audioUrl = video.storageUrl;

    if (!audioUrl) {
      throw new Error(`Video has no storage URL: ${videoId}`);
    }

    // Step 3: Transcribe with Deepgram
    console.log(`[Transcription Workflow] Calling Deepgram for ${videoId}`);
    const result = await transcribeWithWhisper(audioUrl, "en", {
      punctuate: true,
      smartFormat: true,
      diarize: false,
    });

    console.log(`[Transcription Workflow] Got ${result.segments.length} segments`);

    // Step 4: Store transcript
    const transcript = await prisma.transcript.upsert({
      where: { videoId },
      create: {
        videoId,
        content: result.text,
        segments: result.segments,
        language: result.language,
        provider: "DEEPGRAM",
      },
      update: {
        content: result.text,
        segments: result.segments,
        language: result.language,
      },
    });

    // Step 5: Update video with duration
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "READY",
        duration: result.duration || video.duration,
      },
    });

    // Step 6: Mark job complete
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        progress: 100,
        completedAt: new Date(),
        result: { transcriptId: transcript.id, segmentCount: result.segments.length },
      },
    });

    console.log(`[Transcription Workflow] Completed: ${transcript.id}`);

    return { 
      transcriptId: transcript.id,
      segmentCount: result.segments.length,
      duration: result.duration,
    };

  } catch (error) {
    console.error("[Transcription Workflow] Error:", error);

    await prisma.video.update({
      where: { id: videoId },
      data: { status: "ERROR" },
    });

    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      },
    });

    throw error;
  }
}
