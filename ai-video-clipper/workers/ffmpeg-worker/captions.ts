/**
 * Caption overlay operations
 */

interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

export async function addCaptions(
  videoPath: string,
  segments: CaptionSegment[],
): Promise<string> {
  const outputPath = `/tmp/captioned_${Date.now()}.mp4`;

  // Step 1: Generate ASS subtitle file from segments
  const assContent = generateASS(segments);
  // TODO: Write ASS file to temp

  // Step 2: Overlay subtitles using FFmpeg
  // ffmpeg -i {videoPath} -vf "ass={assPath}" {outputPath}

  console.log(`[Captions] Adding ${segments.length} caption segments`);

  return outputPath;
}

function generateASS(segments: CaptionSegment[]): string {
  const header = `[Script Info]
Title: AI Video Clipper Captions
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, Alignment, MarginV
Style: Default,Arial,72,&H00FFFFFF,2,100

[Events]
Format: Layer, Start, End, Style, Text
`;

  const events = segments
    .map((seg) => {
      const start = formatASSTime(seg.start);
      const end = formatASSTime(seg.end);
      return `Dialogue: 0,${start},${end},Default,,0,0,0,,${seg.text}`;
    })
    .join("\n");

  return header + events;
}

function formatASSTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
