/**
 * Speaker diarization
 */

import type { TranscriptSegment, DiarizationResult, Speaker, DiarizedSegment } from "@/types";

/**
 * Process transcript segments into diarized output
 */
export function diarizeSegments(segments: TranscriptSegment[]): DiarizationResult {
  const speakerMap = new Map<string, { totalDuration: number }>();
  const diarizedSegments: DiarizedSegment[] = [];

  for (const seg of segments) {
    const speaker = seg.speaker ?? "Unknown";

    // Track speaker stats
    if (!speakerMap.has(speaker)) {
      speakerMap.set(speaker, { totalDuration: 0 });
    }
    const stats = speakerMap.get(speaker)!;
    stats.totalDuration += seg.end - seg.start;

    diarizedSegments.push({
      start: seg.start,
      end: seg.end,
      speaker,
      text: seg.text,
    });
  }

  const speakers: Speaker[] = Array.from(speakerMap.entries()).map(
    ([label, stats], i) => ({
      id: `speaker_${i}`,
      label,
      totalDuration: stats.totalDuration,
    }),
  );

  return { speakers, segments: diarizedSegments };
}

/**
 * Merge consecutive segments from the same speaker
 */
export function mergeConsecutiveSpeakerSegments(
  segments: DiarizedSegment[],
  maxGap = 2,
): DiarizedSegment[] {
  if (segments.length === 0) return [];

  const merged: DiarizedSegment[] = [{ ...segments[0] }];

  for (let i = 1; i < segments.length; i++) {
    const current = segments[i];
    const last = merged[merged.length - 1];

    const sameSpaker = current.speaker === last.speaker;
    const closeEnough = current.start - last.end <= maxGap;

    if (sameSpaker && closeEnough) {
      last.end = current.end;
      last.text += " " + current.text;
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

/**
 * Get segments for a specific speaker
 */
export function getSegmentsForSpeaker(
  segments: DiarizedSegment[],
  speaker: string,
): DiarizedSegment[] {
  return segments.filter((s) => s.speaker === speaker);
}

/**
 * Identify the primary speaker (most talk time)
 */
export function getPrimarySpeaker(result: DiarizationResult): Speaker | null {
  if (result.speakers.length === 0) return null;
  return result.speakers.reduce((a, b) =>
    a.totalDuration > b.totalDuration ? a : b,
  );
}
