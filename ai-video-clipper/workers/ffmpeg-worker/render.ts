/**
 * FFmpeg rendering operations
 */

import { execSync, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const RESOLUTION_MAP = {
  '720p': '1280:720',
  '1080p': '1080:1920',
  '4k': '2160:3840',
};

interface RenderOptions {
  inputUrl: string;
  startTime: number;
  endTime: number;
  resolution: '720p' | '1080p' | '4k';
  outputFormat?: 'mp4' | 'webm';
}

async function downloadVideo(url: string): Promise<string> {
  const tempPath = path.join('/tmp', `download_${Date.now()}.mp4`);
  execSync(`curl -L -o "${tempPath}" "${url}"`, { timeout: 300000, stdio: ['ignore', 'pipe', 'pipe'] });
  return tempPath;
}

async function runFFmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.on('close', (code) => code === 0 ? resolve() : reject(new Error(`FFmpeg: ${code}`)));
    proc.on('error', reject);
  });
}

export async function render(options: RenderOptions): Promise<string> {
  const { inputUrl, startTime, endTime, resolution, outputFormat = 'mp4' } = options;
  const duration = endTime - startTime;
  const outputPath = path.join('/tmp', `clip_${Date.now()}.${outputFormat}`);
  const inputPath = await downloadVideo(inputUrl);
  try {
    const scaleFilter = RESOLUTION_MAP[resolution] || RESOLUTION_MAP['1080p'];
    await runFFmpeg([
      '-y', '-ss', String(startTime), '-i', inputPath, '-to', String(duration),
      '-vf', `scale=${scaleFilter}:force_original_aspect_ratio=decrease,pad=${scaleFilter}:(ow-iw)/2:(oh-ih)/2`,
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outputPath
    ]);
    return outputPath;
  } finally {
    fs.unlink(inputPath).catch(() => {});
  }
}

export async function resizeForPlatform(inputPath: string, platform: 'youtube' | 'tiktok' | 'instagram'): Promise<string> {
  const ratios = { youtube: '1920:1080', tiktok: '1080:1920', instagram: '1080:1350' };
  const outputPath = path.join('/tmp', `resize_${platform}_${Date.now()}.mp4`);
  await runFFmpeg(['-y', '-i', inputPath, '-vf', `scale=${ratios[platform]}:force_original_aspect_ratio=decrease,pad=${ratios[platform]}:(ow-iw)/2:(oh-ih)/2`, '-c:v', 'libx264', '-preset', 'fast', '-c:a', 'aac', outputPath]);
  return outputPath;
}

export async function generateThumbnail(inputPath: string, timestamp = 0, size = '1080x1920'): Promise<string> {
  const outputPath = path.join('/tmp', `thumb_${Date.now()}.jpg`);
  await runFFmpeg(['-y', '-ss', String(timestamp), '-i', inputPath, '-vframes', '1', '-vf', `scale=${size}:force_original_aspect_ratio=keep`, '-q:v', '2', outputPath]);
  return outputPath;
}
