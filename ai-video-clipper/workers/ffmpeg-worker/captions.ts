/**
 * Caption overlay operations with FFmpeg ASS subtitles
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

interface CaptionSegment {
  start: number;
  end: number;
  text: string;
  style?: {
    fontSize?: number;
    color?: string;
    bold?: boolean;
  };
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

function formatASSTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
}

export async function addCaptions(videoPath: string, segments: CaptionSegment[]): Promise<string> {
  const assPath = path.join('/tmp', `captions_${Date.now()}.ass`);
  const outputPath = path.join('/tmp', `captioned_${Date.now()}.mp4`);

  await fs.writeFile(assPath, generateASS(segments), 'utf8');
  
  await runFFmpeg([
    '-y', '-i', videoPath,
    '-vf', `ass=${assPath}`,
    '-c:a', 'copy',
    outputPath
  ]);

  fs.unlink(assPath).catch(() => {});
  return outputPath;
}

function generateASS(segments: CaptionSegment[]): string {
  const fontSize = 72;
  const header = `[Script Info]
Title: AI Video Clipper
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Alignment, MarginL, MarginR, MarginV
Style: Default,Arial Black,${fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,2,10,10,50

[Events]
Format: Layer, Start, End, Style, Text
`;

  const events = segments
    .map((seg) => `Dialogue: 0,${formatASSTime(seg.start)},${formatASSTime(seg.end)},Default,,0,0,0,,${escapeASS(seg.text)}`)
    .join('\n');

  return header + events;
}

function escapeASS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}').replace(/\n/g, '\\N');
}

export async function addCaptionsSRT(videoPath: string, segments: CaptionSegment[]): Promise<string> {
  const srtPath = path.join('/tmp', `captions_${Date.now()}.srt`);
  const outputPath = path.join('/tmp', `captioned_${Date.now()}.mp4`);

  await fs.writeFile(srtPath, generateSRT(segments), 'utf8');
  
  await runFFmpeg([
    '-y', '-i', videoPath,
    '-vf', `subtitles=${srtPath}`,
    '-c:a', 'copy',
    outputPath
  ]);

  fs.unlink(srtPath).catch(() => {});
  return outputPath;
}

function generateSRT(segments: CaptionSegment[]): string {
  return segments.map((seg, i) => 
    `${i + 1}\n${formatSRTTime(seg.start)} --> ${formatSRTTime(seg.end)}\n${seg.text}\n`
  ).join('\n');
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
}
