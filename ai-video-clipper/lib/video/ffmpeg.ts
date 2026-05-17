/**
 * FFmpeg command builder
 */

import { execSync } from "child_process";
import { logger } from "@/lib/utils/logger";

interface FFmpegCommand {
  input: string;
  output: string;
  args: string[];
}

/**
 * Build and execute an FFmpeg command
 */
export function runFFmpeg(command: FFmpegCommand): void {
  const args = ["-i", command.input, ...command.args, "-y", command.output];
  const cmd = `ffmpeg ${args.join(" ")}`;

  logger.info("Running FFmpeg", { cmd });

  try {
    execSync(cmd, { stdio: "pipe", timeout: 300_000 });
  } catch (error) {
    logger.error("FFmpeg failed", { cmd, error: String(error) });
    throw new Error(`FFmpeg command failed: ${cmd}`);
  }
}

/**
 * Trim video to a specific time range
 */
export function trimVideo(input: string, output: string, start: number, end: number): void {
  runFFmpeg({
    input,
    output,
    args: ["-ss", String(start), "-to", String(end), "-c", "copy"],
  });
}

/**
 * Extract audio from video
 */
export function extractAudioFromVideo(input: string, output: string): void {
  runFFmpeg({
    input,
    output,
    args: ["-vn", "-acodec", "libmp3lame", "-q:a", "2"],
  });
}

/**
 * Resize video to target dimensions
 */
export function resizeVideo(input: string, output: string, width: number, height: number): void {
  runFFmpeg({
    input,
    output,
    args: ["-vf", `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`, "-c:a", "copy"],
  });
}

/**
 * Overlay subtitle file onto video
 */
export function overlaySubtitles(input: string, output: string, subtitlePath: string): void {
  runFFmpeg({
    input,
    output,
    args: ["-vf", `ass=${subtitlePath}`, "-c:a", "copy"],
  });
}

/**
 * Extract a single frame as thumbnail
 */
export function extractFrame(input: string, output: string, timestamp: number): void {
  runFFmpeg({
    input,
    output,
    args: ["-ss", String(timestamp), "-vframes", "1", "-q:v", "2"],
  });
}

/**
 * Get video duration using ffprobe
 */
export function getVideoDuration(input: string): number {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${input}"`,
      { encoding: "utf-8" },
    );
    return parseFloat(result.trim());
  } catch {
    return 0;
  }
}
