/**
 * Final clip rendering pipeline
 */

import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import { trimVideo, resizeVideo } from "./ffmpeg";
import { renderCaptionsOnVideo } from "./captions";
import { uploadToR2, getClipKey } from "@/lib/storage/r2";
import { readFileSync, unlinkSync } from "fs";
import { logger } from "@/lib/utils/logger";
import type { RenderSettings, CaptionData } from "@/types";

const RENDER_DIR = "/tmp/clip-rendering";

const RESOLUTION_MAP: Record<string, { width: number; height: number }> = {
  "720p": { width: 720, height: 1280 },
  "1080p": { width: 1080, height: 1920 },
  "4k": { width: 2160, height: 3840 },
};

interface RenderInput {
  clipId: string;
  userId: string;
  videoPath: string;
  startTime: number;
  endTime: number;
  settings: RenderSettings;
  captions?: CaptionData;
}

interface RenderOutput {
  storageKey: string;
  duration: number;
  fileSize: number;
}

/**
 * Render a final clip with all processing steps
 */
export async function renderClip(input: RenderInput): Promise<RenderOutput> {
  const { clipId, userId, videoPath, startTime, endTime, settings, captions } = input;

  ensureDir(RENDER_DIR);

  const steps: string[] = [];
  let currentPath = videoPath;

  try {
    // Step 1: Trim to clip boundaries
    const trimmedPath = join(RENDER_DIR, `${clipId}_trimmed.mp4`);
    trimVideo(currentPath, trimmedPath, startTime, endTime);
    currentPath = trimmedPath;
    steps.push(currentPath);
    logger.info("Render: trimmed", { clipId });

    // Step 2: Resize to target resolution
    const resolution = RESOLUTION_MAP[settings.resolution] ?? RESOLUTION_MAP["1080p"];
    const resizedPath = join(RENDER_DIR, `${clipId}_resized.mp4`);
    resizeVideo(currentPath, resizedPath, resolution.width, resolution.height);
    currentPath = resizedPath;
    steps.push(currentPath);
    logger.info("Render: resized", { clipId, resolution: settings.resolution });

    // Step 3: Add captions if enabled
    if (settings.includeCaptions && captions) {
      const captionedPath = join(RENDER_DIR, `${clipId}_captioned.mp4`);
      renderCaptionsOnVideo(currentPath, captions, captionedPath);
      currentPath = captionedPath;
      steps.push(currentPath);
      logger.info("Render: captions added", { clipId });
    }

    // Step 4: Upload to storage
    const storageKey = getClipKey(userId, clipId);
    const fileBuffer = readFileSync(currentPath);
    await uploadToR2(storageKey, fileBuffer, "video/mp4");
    logger.info("Render: uploaded", { clipId, storageKey });

    return {
      storageKey,
      duration: endTime - startTime,
      fileSize: fileBuffer.length,
    };
  } finally {
    // Cleanup temp files
    for (const path of steps) {
      try { unlinkSync(path); } catch { /* ignore */ }
    }
  }
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
