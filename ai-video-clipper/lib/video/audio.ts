/**
 * Audio extraction and manipulation
 */

import { execSync } from "child_process";
import { extractAudioFromVideo, runFFmpeg } from "./ffmpeg";
import { join } from "path";
import { logger } from "@/lib/utils/logger";

/**
 * Extract audio from video file
 */
export function extractAudio(videoPath: string, outputPath: string): string {
  extractAudioFromVideo(videoPath, outputPath);
  return outputPath;
}

/**
 * Trim audio to a specific time range
 */
export function trimAudio(inputPath: string, outputPath: string, start: number, end: number): string {
  runFFmpeg({
    input: inputPath,
    output: outputPath,
    args: ["-ss", String(start), "-to", String(end), "-c", "copy"],
  });
  return outputPath;
}

/**
 * Normalize audio levels
 */
export function normalizeAudio(inputPath: string, outputPath: string): string {
  // Two-pass loudness normalization (EBU R128)
  runFFmpeg({
    input: inputPath,
    output: outputPath,
    args: ["-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100"],
  });
  return outputPath;
}

/**
 * Get audio duration
 */
export function getAudioDuration(audioPath: string): number {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${audioPath}"`,
      { encoding: "utf-8" },
    );
    return parseFloat(result.trim());
  } catch {
    return 0;
  }
}

/**
 * Detect silence periods in audio
 */
export function detectSilence(
  audioPath: string,
  threshold = -30,
  minDuration = 0.5,
): Array<{ start: number; end: number }> {
  try {
    const result = execSync(
      `ffmpeg -i "${audioPath}" -af "silencedetect=noise=${threshold}dB:d=${minDuration}" -f null - 2>&1`,
      { encoding: "utf-8" },
    );

    const silences: Array<{ start: number; end: number }> = [];
    const startMatches = result.matchAll(/silence_start: ([\d.]+)/g);
    const endMatches = result.matchAll(/silence_end: ([\d.]+)/g);

    const starts = Array.from(startMatches).map((m) => parseFloat(m[1]));
    const ends = Array.from(endMatches).map((m) => parseFloat(m[1]));

    for (let i = 0; i < Math.min(starts.length, ends.length); i++) {
      silences.push({ start: starts[i], end: ends[i] });
    }

    return silences;
  } catch (error) {
    logger.warn("Silence detection failed", { audioPath });
    return [];
  }
}

/**
 * Convert audio to WAV format (required by some transcription APIs)
 */
export function convertToWav(inputPath: string, outputPath: string): string {
  runFFmpeg({
    input: inputPath,
    output: outputPath,
    args: ["-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1"],
  });
  return outputPath;
}
