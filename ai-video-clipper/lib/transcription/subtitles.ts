/**
 * Subtitle generation (SRT/VTT)
 */

import { formatSRTTimestamp, formatVTTTimestamp } from "@/lib/utils/date";
import type { TranscriptSegment } from "@/types";

/**
 * Generate SRT subtitle content
 */
export function generateSRT(segments: TranscriptSegment[]): string {
  return segments
    .map((seg, i) => {
      const start = formatSRTTimestamp(seg.start);
      const end = formatSRTTimestamp(seg.end);
      return `${i + 1}\n${start} --> ${end}\n${seg.text}\n`;
    })
    .join("\n");
}

/**
 * Generate WebVTT subtitle content
 */
export function generateVTT(segments: TranscriptSegment[]): string {
  const header = "WEBVTT\n\n";
  const cues = segments
    .map((seg) => {
      const start = formatVTTTimestamp(seg.start);
      const end = formatVTTTimestamp(seg.end);
      return `${start} --> ${end}\n${seg.text}\n`;
    })
    .join("\n");
  return header + cues;
}

/**
 * Parse SRT content into segments
 */
export function parseSRT(content: string): TranscriptSegment[] {
  const blocks = content.trim().split(/\n\n+/);
  const segments: TranscriptSegment[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.length < 3) continue;

    const timeMatch = lines[1].match(
      /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/,
    );
    if (!timeMatch) continue;

    const start = parseSRTTime(timeMatch[1]);
    const end = parseSRTTime(timeMatch[2]);
    const text = lines.slice(2).join(" ").trim();

    segments.push({ start, end, text });
  }

  return segments;
}

/**
 * Parse VTT content into segments
 */
export function parseVTT(content: string): TranscriptSegment[] {
  const lines = content.split("\n");
  const segments: TranscriptSegment[] = [];
  let i = 0;

  // Skip WEBVTT header
  while (i < lines.length && !lines[i].includes("-->")) i++;

  while (i < lines.length) {
    const timeMatch = lines[i].match(
      /(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/,
    );
    if (timeMatch) {
      const start = parseVTTTime(timeMatch[1]);
      const end = parseVTTTime(timeMatch[2]);
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i].trim());
        i++;
      }
      segments.push({ start, end, text: textLines.join(" ") });
    }
    i++;
  }

  return segments;
}

function parseSRTTime(time: string): number {
  const [hms, ms] = time.split(",");
  const [h, m, s] = hms.split(":").map(Number);
  return h * 3600 + m * 60 + s + Number(ms) / 1000;
}

function parseVTTTime(time: string): number {
  const [hms, ms] = time.split(".");
  const [h, m, s] = hms.split(":").map(Number);
  return h * 3600 + m * 60 + s + Number(ms) / 1000;
}
