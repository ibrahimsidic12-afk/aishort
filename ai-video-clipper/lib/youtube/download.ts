/**
 * YouTube video download via yt-dlp
 *
 * Downloads a YouTube video by URL to local temp storage,
 * then uploads to R2 for processing.
 */

import { execSync, exec } from "child_process";
import { existsSync, statSync, unlinkSync } from "fs";
import { join } from "path";
import { logger } from "@/lib/utils/logger";
import { uploadToR2, getVideoKey } from "@/lib/storage/r2";
import { readFileSync } from "fs";

const TEMP_DIR = "/tmp/youtube-downloads";

interface YouTubeVideoInfo {
  id: string;
  title: string;
  duration: number; // seconds
  thumbnail: string;
  channel: string;
  description: string;
  fileSize?: number;
}

interface DownloadResult {
  localPath: string;
  info: YouTubeVideoInfo;
  fileName: string;
}

interface UploadResult {
  storageKey: string;
  info: YouTubeVideoInfo;
  fileSize: number;
}

/**
 * Validate a YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/,
    /^https?:\/\/m\.youtube\.com\/watch\?v=[\w-]+/,
  ];
  return patterns.some((p) => p.test(url));
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Get video metadata without downloading
 */
export async function getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
  try {
    const result = execSync(
      `yt-dlp --dump-json --no-download "${url}"`,
      { encoding: "utf-8", timeout: 30_000 },
    );

    const data = JSON.parse(result);

    return {
      id: data.id,
      title: data.title || "Untitled",
      duration: data.duration || 0,
      thumbnail: data.thumbnail || "",
      channel: data.channel || data.uploader || "Unknown",
      description: (data.description || "").slice(0, 500),
      fileSize: data.filesize_approx || data.filesize,
    };
  } catch (error) {
    logger.error("Failed to get YouTube video info", { url, error: String(error) });
    throw new Error("Failed to get video info. Please check the URL is valid and the video is public.");
  }
}

/**
 * Download a YouTube video to local temp directory
 */
export async function downloadVideo(url: string): Promise<DownloadResult> {
  // Ensure temp dir exists
  execSync(`mkdir -p ${TEMP_DIR}`);

  // Get video info first
  const info = await getVideoInfo(url);

  // Check duration limit (4 hours max)
  if (info.duration > 14400) {
    throw new Error("Video is too long. Maximum duration is 4 hours.");
  }

  const outputTemplate = join(TEMP_DIR, `${info.id}.%(ext)s`);
  const expectedPath = join(TEMP_DIR, `${info.id}.mp4`);

  logger.info("Downloading YouTube video", { id: info.id, title: info.title, duration: info.duration });

  try {
    // Download best quality mp4, max 1080p
    execSync(
      `yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best" --merge-output-format mp4 -o "${outputTemplate}" "${url}"`,
      { timeout: 600_000, stdio: "pipe" }, // 10 min timeout
    );

    // Find the downloaded file (extension might vary)
    let localPath = expectedPath;
    if (!existsSync(localPath)) {
      // Try to find any file with this ID
      const files = execSync(`ls ${TEMP_DIR}/${info.id}.*`, { encoding: "utf-8" }).trim().split("\n");
      if (files.length > 0 && files[0]) {
        localPath = files[0];
      } else {
        throw new Error("Download completed but file not found");
      }
    }

    const fileName = `${info.title.replace(/[^a-zA-Z0-9\s-]/g, "").trim().slice(0, 100)}.mp4`;

    logger.info("YouTube video downloaded", { id: info.id, path: localPath });

    return { localPath, info, fileName };
  } catch (error) {
    logger.error("YouTube download failed", { url, error: String(error) });
    throw new Error("Failed to download video. It may be private, age-restricted, or region-locked.");
  }
}

/**
 * Download YouTube video and upload to R2
 */
export async function downloadAndUploadToR2(
  url: string,
  userId: string,
): Promise<UploadResult> {
  const { localPath, info, fileName } = await downloadVideo(url);

  try {
    // Get file size
    const stats = statSync(localPath);
    const fileSize = stats.size;

    // Generate R2 key
    const storageKey = getVideoKey(userId, fileName);

    // Read and upload to R2
    const fileBuffer = readFileSync(localPath);
    await uploadToR2(storageKey, fileBuffer, "video/mp4");

    logger.info("YouTube video uploaded to R2", { id: info.id, storageKey, fileSize });

    return { storageKey, info, fileSize };
  } finally {
    // Cleanup temp file
    try {
      unlinkSync(localPath);
    } catch {
      // ignore cleanup errors
    }
  }
}

/**
 * Check if yt-dlp is installed
 */
export function isYtDlpInstalled(): boolean {
  try {
    execSync("yt-dlp --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}
