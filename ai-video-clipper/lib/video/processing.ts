/**
 * Video processing pipeline
 */

import { trimVideo, extractAudioFromVideo, getVideoDuration } from "./ffmpeg";
import { extractMetadata } from "./metadata";
import { prisma } from "@/lib/db/prisma";
import { getFromR2 } from "@/lib/storage/r2";
import { logger } from "@/lib/utils/logger";
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import { join } from "path";

const TEMP_DIR = "/tmp/video-processing";

/**
 * Ensure temp directory exists
 */
function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * Process a newly uploaded video
 */
export async function processUploadedVideo(videoId: string): Promise<void> {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) throw new Error(`Video not found: ${videoId}`);

  logger.info("Processing video", { videoId, fileName: video.fileName });

  await prisma.video.update({
    where: { id: videoId },
    data: { status: "PROCESSING" },
  });

  try {
    ensureTempDir();

    // Download video from storage
    const localPath = join(TEMP_DIR, `${videoId}_source.mp4`);
    const r2Object = await getFromR2(video.storageKey);
    const body = await r2Object.Body?.transformToByteArray();
    if (!body) throw new Error("Failed to download video from storage");
    writeFileSync(localPath, Buffer.from(body));

    // Extract metadata
    const metadata = await extractMetadata(localPath);

    // Extract audio for transcription
    const audioPath = join(TEMP_DIR, `${videoId}_audio.mp3`);
    extractAudioFromVideo(localPath, audioPath);

    // Update video with metadata
    await prisma.video.update({
      where: { id: videoId },
      data: {
        duration: metadata.duration,
        metadata: metadata as any,
        status: "READY",
      },
    });

    // Cleanup temp files
    cleanup(localPath, audioPath);

    logger.info("Video processing complete", { videoId });
  } catch (error) {
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "ERROR" },
    });
    throw error;
  }
}

/**
 * Extract a clip from a video
 */
export async function extractClip(
  videoPath: string,
  start: number,
  end: number,
  outputPath: string,
): Promise<void> {
  trimVideo(videoPath, outputPath, start, end);
}

function cleanup(...paths: string[]) {
  for (const p of paths) {
    try { unlinkSync(p); } catch { /* ignore */ }
  }
}
