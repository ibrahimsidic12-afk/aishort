/**
 * AI Scoring Module
 * Uses Regolo AI for segment scoring and virality prediction
 */

import { scoreForEngagement, predictVirality } from "./regolo";

/**
 * Score video segments for engagement potential
 */
export async function scoreSegments(input: Array<{ start: number; end: number; score?: number }>): Promise<
  Array<{ start: number; end: number; score: number }>
> {
  console.log(`[Scoring] Processing ${input.length} segments...`);

  try {
    const scored = await scoreForEngagement(
      input.map(s => ({ start: s.start, end: s.end, text: "" }))
    );

    return scored.map(s => ({
      start: s.start,
      end: s.end,
      score: s.score,
    }));
  } catch (error) {
    console.error("[Scoring] Error:", error);
    // Return original with default score on error
    return input.map(s => ({
      start: s.start,
      end: s.end,
      score: s.score ?? 50,
    }));
  }
}

/**
 * Detect viral moments from transcript text
 */
export async function detectViralMoments(input: {
  transcript: string;
  minScore?: number;
}): Promise<Array<{ start: number; end: number; score: number; reasons: string[] }>> {
  console.log("[Virality] Analyzing transcript for viral moments...");

  try {
    // Split transcript into rough segments (every ~30 seconds)
    const segments = [];
    const wordsPerSecond = 2.5; // avg speech rate
    const chunkSize = 30; // seconds

    const words = input.transcript.split(/\s+/);
    let currentPos = 0;

    while (currentPos < words.length) {
      const chunkWords = words.slice(currentPos, currentPos + chunkSize * wordsPerSecond);
      const start = currentPos / wordsPerSecond;
      const end = (currentPos + chunkWords.length) / wordsPerSecond;

      segments.push({
        start: Math.round(start),
        end: Math.round(end),
        text: chunkWords.join(" "),
      });

      currentPos += chunkWords.length;
    }

    const predictions = await predictVirality(segments);
    const threshold = input.minScore ?? 70;

    return predictions
      .filter(p => p.viralityScore >= threshold)
      .map(p => ({
        start: p.start,
        end: p.end,
        score: p.viralityScore,
        reasons: p.reasons,
      }));
  } catch (error) {
    console.error("[Virality] Error:", error);
    return [];
  }
}

export { scoreForEngagement, predictVirality };
