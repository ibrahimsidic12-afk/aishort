/**
 * Caption overlay rendering
 */

import { writeFileSync } from "fs";
import { join } from "path";
import { overlaySubtitles } from "./ffmpeg";
import type { CaptionData, CaptionStyle, CaptionSegment } from "@/types";

const DEFAULT_STYLE: CaptionStyle = {
  fontFamily: "Arial",
  fontSize: 72,
  fontColor: "#FFFFFF",
  backgroundColor: "rgba(0,0,0,0.6)",
  position: "bottom",
  animation: "pop",
};

/**
 * Generate ASS subtitle file from caption data
 */
export function generateASSFile(captions: CaptionData, outputPath: string): string {
  const style = captions.style ?? DEFAULT_STYLE;

  const header = `[Script Info]
Title: AI Video Clipper Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontFamily},${style.fontSize},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,3,1,${getAlignment(style.position)},40,40,60,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = captions.segments
    .map((seg) => {
      const start = formatASSTime(seg.start);
      const end = formatASSTime(seg.end);
      const text = escapeASSText(seg.text);
      return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
    })
    .join("\n");

  const content = header + events;
  writeFileSync(outputPath, content);
  return outputPath;
}

/**
 * Render captions onto a video
 */
export function renderCaptionsOnVideo(
  videoPath: string,
  captions: CaptionData,
  outputPath: string,
): string {
  const assPath = outputPath.replace(/\.\w+$/, ".ass");
  generateASSFile(captions, assPath);
  overlaySubtitles(videoPath, outputPath, assPath);
  return outputPath;
}

/**
 * Create word-by-word caption segments for animated captions
 */
export function createWordByWordSegments(
  segments: CaptionSegment[],
): CaptionSegment[] {
  const wordSegments: CaptionSegment[] = [];

  for (const seg of segments) {
    if (seg.words && seg.words.length > 0) {
      // Group words into 3-4 word chunks
      const chunkSize = 3;
      for (let i = 0; i < seg.words.length; i += chunkSize) {
        const chunk = seg.words.slice(i, i + chunkSize);
        wordSegments.push({
          start: chunk[0].start,
          end: chunk[chunk.length - 1].end,
          text: chunk.map((w) => w.text).join(" "),
          words: chunk,
        });
      }
    } else {
      wordSegments.push(seg);
    }
  }

  return wordSegments;
}

function getAlignment(position: string): number {
  switch (position) {
    case "top": return 8;
    case "center": return 5;
    case "bottom": default: return 2;
  }
}

function formatASSTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function escapeASSText(text: string): string {
  return text.replace(/\n/g, "\\N");
}
