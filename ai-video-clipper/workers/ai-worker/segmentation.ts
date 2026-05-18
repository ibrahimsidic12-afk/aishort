/**
 * AI Content Segmentation Worker
 * Uses Regolo AI to identify logical breakpoints in video content
 */

import { prisma } from "@/lib/db/prisma";
import { segmentTranscript, scoreForEngagement, type Segment as AISegment, type ScoredSegment } from "../../lib/ai/regolo";

interface Segment extends AISegment {}

interface SegmentOptions {
  minDuration?: number;
  maxDuration?: number;
  maxSegments?: number;
}

/**
 * Segment content into logical clip-worthy sections
 */
export async function segmentContent(
  transcriptId: string,
  options?: SegmentOptions
): Promise<Segment[]> {
  console.log(`[Segmentation] Processing transcript: ${transcriptId}`);

  const transcript = await prisma.transcript.findUnique({
    where: { id: transcriptId },
    include: { video: true },
  });

  if (!transcript) {
    throw new Error(`Transcript not found: ${transcriptId}`);
  }

  const segments = await segmentTranscript(transcript.content, {
    minDuration: options?.minDuration ?? 15,
    maxDuration: options?.maxDuration ?? 90,
    maxSegments: options?.maxSegments ?? 10,
  });

  const enrichedSegments = await enrichWithTranscriptText(segments, transcript.segments as any[]);

  console.log(`[Segmentation] Identified ${enrichedSegments.length} segments`);
  return enrichedSegments;
}

async function enrichWithTranscriptText(
  segments: AISegment[],
  transcriptSegments: Array<{ start: number; end: number; text: string }>
): Promise<Segment[]> {
  if (!transcriptSegments || transcriptSegments.length === 0) {
    return segments.map(s => ({ ...s }));
  }

  return segments.map(segment => {
    const overlapping = transcriptSegments.filter(ts =>
      (ts.start >= segment.start && ts.start < segment.end) ||
      (ts.end > segment.start && ts.end <= segment.end) ||
      (ts.start <= segment.start && ts.end >= segment.end)
    );
    const text = overlapping.map(ts => ts.text).join(" ");
    return {
      start: segment.start,
      end: segment.end,
      text: text || segment.text || "",
      speaker: segment.speaker,
    };
  });
}

export async function segmentAndScore(
  transcriptId: string,
  videoContext?: string
): Promise<Array<{ start: number; end: number; text: string; score: number; reason: string }>> {
  console.log(`[Segmentation] Segmenting and scoring: ${transcriptId}`);

  const segments = await segmentContent(transcriptId);

  if (segments.length === 0) {
    return [];
  }

  const scored = await scoreForEngagement(segments, videoContext);

  return scored.map((s, i) => ({
    start: s.start,
    end: s.end,
    text: segments[i]?.text || "",
    score: s.score,
    reason: s.reason,
  }));
}
