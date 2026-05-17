/**
 * Video segmentation logic
 */

import type { TranscriptSegment } from "@/types";

interface ContentSegment {
  start: number;
  end: number;
  text: string;
  topic: string;
  speaker?: string;
}

/**
 * Segment transcript by topic changes
 */
export function segmentByTopic(
  segments: TranscriptSegment[],
  options?: { minSegmentDuration?: number; maxSegmentDuration?: number },
): ContentSegment[] {
  const { minSegmentDuration = 15, maxSegmentDuration = 120 } = options ?? {};

  const contentSegments: ContentSegment[] = [];
  let currentSegment: ContentSegment | null = null;

  for (const seg of segments) {
    if (!currentSegment) {
      currentSegment = {
        start: seg.start,
        end: seg.end,
        text: seg.text,
        topic: "unknown",
        speaker: seg.speaker,
      };
      continue;
    }

    const currentDuration = seg.end - currentSegment.start;

    // Check for natural breaks
    const hasLongPause = seg.start - currentSegment.end > 2;
    const speakerChanged = seg.speaker && seg.speaker !== currentSegment.speaker;
    const tooLong = currentDuration >= maxSegmentDuration;

    if ((hasLongPause || speakerChanged || tooLong) && currentDuration >= minSegmentDuration) {
      contentSegments.push(currentSegment);
      currentSegment = {
        start: seg.start,
        end: seg.end,
        text: seg.text,
        topic: "unknown",
        speaker: seg.speaker,
      };
    } else {
      currentSegment.end = seg.end;
      currentSegment.text += " " + seg.text;
      if (speakerChanged) currentSegment.speaker = seg.speaker;
    }
  }

  // Push last segment
  if (currentSegment && (currentSegment.end - currentSegment.start) >= minSegmentDuration) {
    contentSegments.push(currentSegment);
  }

  return contentSegments;
}

/**
 * Segment by speaker (for multi-speaker content)
 */
export function segmentBySpeaker(segments: TranscriptSegment[]): ContentSegment[] {
  const speakerSegments: ContentSegment[] = [];
  let current: ContentSegment | null = null;

  for (const seg of segments) {
    if (!current || current.speaker !== seg.speaker) {
      if (current) speakerSegments.push(current);
      current = {
        start: seg.start,
        end: seg.end,
        text: seg.text,
        topic: "unknown",
        speaker: seg.speaker,
      };
    } else {
      current.end = seg.end;
      current.text += " " + seg.text;
    }
  }

  if (current) speakerSegments.push(current);
  return speakerSegments;
}

/**
 * Find silence gaps in audio (potential cut points)
 */
export function findSilenceGaps(
  segments: TranscriptSegment[],
  minGap = 1.5,
): Array<{ start: number; end: number; duration: number }> {
  const gaps: Array<{ start: number; end: number; duration: number }> = [];

  for (let i = 0; i < segments.length - 1; i++) {
    const gap = segments[i + 1].start - segments[i].end;
    if (gap >= minGap) {
      gaps.push({
        start: segments[i].end,
        end: segments[i + 1].start,
        duration: gap,
      });
    }
  }

  return gaps;
}
