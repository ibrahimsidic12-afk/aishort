/**
 * Thumbnail extraction from video
 */

interface ExtractOptions {
  videoUrl: string;
  startTime: number;
  endTime: number;
  count: number;
}

export async function extractFrames(options: ExtractOptions): Promise<string[]> {
  const { videoUrl, startTime, endTime, count } = options;
  const interval = (endTime - startTime) / count;

  const framePaths: string[] = [];

  for (let i = 0; i < count; i++) {
    const time = startTime + interval * i + interval / 2;
    const outputPath = `/tmp/thumb_${Date.now()}_${i}.jpg`;

    // TODO: FFmpeg frame extraction
    // ffmpeg -i {videoUrl} -ss {time} -vframes 1 -q:v 2 {outputPath}

    framePaths.push(outputPath);
  }

  return framePaths;
}
