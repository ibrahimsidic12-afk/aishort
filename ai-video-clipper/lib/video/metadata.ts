/**
 * Video metadata extraction
 */

import { execSync } from "child_process";
import { logger } from "@/lib/utils/logger";
import type { VideoMetadata } from "@/types";

interface FullMetadata extends VideoMetadata {
  duration: number;
  format: string;
  size: number;
}

/**
 * Extract full metadata from a video file using ffprobe
 */
export async function extractMetadata(videoPath: string): Promise<FullMetadata> {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration,size,format_name -show_entries stream=width,height,r_frame_rate,bit_rate,codec_name,codec_type -of json "${videoPath}"`,
      { encoding: "utf-8" },
    );

    const data = JSON.parse(result);
    const format = data.format ?? {};
    const videoStream = data.streams?.find((s: any) => s.codec_type === "video");
    const audioStream = data.streams?.find((s: any) => s.codec_type === "audio");

    // Parse frame rate from fraction (e.g., "30/1")
    let fps = 0;
    if (videoStream?.r_frame_rate) {
      const [num, den] = videoStream.r_frame_rate.split("/").map(Number);
      fps = den ? num / den : num;
    }

    return {
      duration: parseFloat(format.duration ?? "0"),
      format: format.format_name ?? "unknown",
      size: parseInt(format.size ?? "0"),
      width: videoStream?.width ?? 0,
      height: videoStream?.height ?? 0,
      fps: Math.round(fps),
      bitrate: parseInt(videoStream?.bit_rate ?? "0"),
      codec: videoStream?.codec_name ?? "unknown",
      audioCodec: audioStream?.codec_name ?? "unknown",
    };
  } catch (error) {
    logger.error("Failed to extract metadata", { videoPath, error: String(error) });
    return {
      duration: 0,
      format: "unknown",
      size: 0,
    };
  }
}

/**
 * Check if a video file is valid
 */
export async function validateVideoFile(videoPath: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    execSync(`ffprobe -v error "${videoPath}"`, { encoding: "utf-8" });
    return { valid: true };
  } catch (error) {
    return { valid: false, error: String(error) };
  }
}

/**
 * Get video aspect ratio
 */
export function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

/**
 * Check if video is vertical (portrait mode)
 */
export function isVerticalVideo(width: number, height: number): boolean {
  return height > width;
}
