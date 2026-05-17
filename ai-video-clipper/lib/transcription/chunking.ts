/**
 * Audio chunking for long videos
 */

import type { TranscriptSegment } from "@/types";

const MAX_CHUNK_DURATION = 1500; // 25 minutes in seconds
const OVERLAP_DURATION = 5; // 5 second overlap between chunks

interface AudioChunk {
  index: number;
  startTime: number;
  endTime: number;
  duration: number;
}

/**
 * Calculate chunk boundaries for a given duration
 */
export function calculateChunks(totalDuration: number): AudioChunk[] {
  if (totalDuration <= MAX_CHUNK_DURATION) {
    return [{ index: 0, startTime: 0, endTime: totalDuration, duration: totalDuration }];
  }

  const chunks: AudioChunk[] = [];
  let currentStart = 0;
  let index = 0;

  while (currentStart < totalDuration) {
    const endTime = Math.min(currentStart + MAX_CHUNK_DURATION, totalDuration);
    chunks.push({
      index,
      startTime: currentStart,
      endTime,
      duration: endTime - currentStart,
    });
    currentStart = endTime - OVERLAP_DURATION;
    index++;
  }

  return chunks;
}

/**
 * Merge segments from multiple chunks, handling overlaps
 */
export function mergeChunkResults(
  chunkResults: Array<{ chunk: AudioChunk; segments: TranscriptSegment[] }>,
): TranscriptSegment[] {
  if (chunkResults.length === 0) return [];
  if (chunkResults.length === 1) return chunkResults[0].segments;

  // Sort chunks by start time
  const sorted = [...chunkResults].sort((a, b) => a.chunk.startTime - b.chunk.startTime);

  const merged: TranscriptSegment[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const { chunk, segments } = sorted[i];

    for (const seg of segments) {
      // Adjust segment time based on chunk offset
      const adjustedSeg: TranscriptSegment = {
        ...seg,
        start: seg.start + chunk.startTime,
        end: seg.end + chunk.startTime,
        words: seg.words?.map((w) => ({
          ...w,
          start: w.start + chunk.startTime,
          end: w.end + chunk.startTime,
        })),
      };

      // Skip segments in the overlap region of previous chunk
      if (i > 0) {
        const prevChunk = sorted[i - 1].chunk;
        if (adjustedSeg.start < prevChunk.endTime) {
          continue; // Already covered by previous chunk
        }
      }

      merged.push(adjustedSeg);
    }
  }

  return merged;
}

/**
 * Check if a video needs chunking
 */
export function needsChunking(durationSeconds: number): boolean {
  return durationSeconds > MAX_CHUNK_DURATION;
}

/**
 * Get optimal chunk count
 */
export function getChunkCount(durationSeconds: number): number {
  return calculateChunks(durationSeconds).length;
}
