/**
 * Thumbnail extraction
 */

import { extractFrame, getVideoDuration } from "./ffmpeg";
import { join } from "path";

interface ThumbnailOptions {
  count?: number;
  width?: number;
  height?: number;
}

/**
 * Extract multiple thumbnails from a video at even intervals
 */
export function extractThumbnails(
  videoPath: string,
  outputDir: string,
  options?: ThumbnailOptions,
): string[] {
  const { count = 5 } = options ?? {};
  const duration = getVideoDuration(videoPath);
  const interval = duration / (count + 1);

  const thumbnails: string[] = [];

  for (let i = 1; i <= count; i++) {
    const timestamp = interval * i;
    const outputPath = join(outputDir, `thumb_${i}.jpg`);
    extractFrame(videoPath, outputPath, timestamp);
    thumbnails.push(outputPath);
  }

  return thumbnails;
}

/**
 * Extract thumbnail at a specific timestamp
 */
export function extractThumbnailAt(
  videoPath: string,
  timestamp: number,
  outputPath: string,
): string {
  extractFrame(videoPath, outputPath, timestamp);
  return outputPath;
}

/**
 * Extract thumbnail at the midpoint of a clip
 */
export function extractClipThumbnail(
  videoPath: string,
  startTime: number,
  endTime: number,
  outputPath: string,
): string {
  const midpoint = startTime + (endTime - startTime) / 2;
  return extractThumbnailAt(videoPath, midpoint, outputPath);
}

/**
 * Select the best thumbnail from candidates (placeholder for AI selection)
 */
export async function selectBestThumbnail(thumbnailPaths: string[]): Promise<string> {
  // TODO: Use AI vision model to select the most visually appealing frame
  // For now, return the middle one
  const midIndex = Math.floor(thumbnailPaths.length / 2);
  return thumbnailPaths[midIndex];
}
