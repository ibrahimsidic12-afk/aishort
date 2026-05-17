/**
 * Subtitle generation (SRT/VTT)
 */

interface Segment {
  start: number;
  end: number;
  text: string;
}

export function generateSubtitles(segments: Segment[]) {
  return {
    srt: generateSRT(segments),
    vtt: generateVTT(segments),
  };
}

function generateSRT(segments: Segment[]): string {
  return segments
    .map((seg, i) => {
      return `${i + 1}\n${formatSRTTime(seg.start)} --> ${formatSRTTime(seg.end)}\n${seg.text}\n`;
    })
    .join("\n");
}

function generateVTT(segments: Segment[]): string {
  const lines = ["WEBVTT\n"];
  segments.forEach((seg) => {
    lines.push(`${formatVTTTime(seg.start)} --> ${formatVTTTime(seg.end)}`);
    lines.push(seg.text);
    lines.push("");
  });
  return lines.join("\n");
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms).padStart(3, "0")}`;
}

function formatVTTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}.${String(ms).padStart(3, "0")}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
