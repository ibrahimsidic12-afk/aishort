/**
 * FFmpeg Worker
 *
 * Processes video rendering jobs:
 * - Clip extraction (trim video)
 * - Caption overlay
 * - Resize for different platforms
 * - Thumbnail generation
 */

import { fileURLToPath } from "url";
import { render } from "./render.js";
import { addCaptions } from "./captions.js";

interface RenderJob {
  clipId: string;
  videoUrl: string;
  startTime: number;
  endTime: number;
  resolution: "720p" | "1080p" | "4k";
  captions?: { segments: Array<{ start: number; end: number; text: string }> };
  outputKey: string;
}

export async function processRenderJob(job: RenderJob) {
  console.log(`[FFmpeg Worker] Processing clip: ${job.clipId}`);

  // Step 1: Download source video
  // TODO: Download from R2 signed URL

  // Step 2: Trim clip
  const trimmedPath = await render({
    inputUrl: job.videoUrl,
    startTime: job.startTime,
    endTime: job.endTime,
    resolution: job.resolution,
  });

  // Step 3: Add captions if provided
  let outputPath = trimmedPath;
  if (job.captions) {
    outputPath = await addCaptions(trimmedPath, job.captions.segments);
  }

  // Step 4: Upload result to storage
  // TODO: Upload to R2

  console.log(`[FFmpeg Worker] Complete: ${job.clipId}`);
  return { outputKey: job.outputKey, outputPath };
}

// ESM-compatible worker entry point
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  console.log("[FFmpeg Worker] Starting...");
  // TODO: Connect to job queue and listen for render jobs
}
