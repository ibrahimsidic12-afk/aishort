/**
 * Video content analysis
 */

import { chatCompletionJSON } from "./client";
import { PROMPTS } from "./prompts";
import type { TranscriptSegment } from "@/types";

interface AnalyzedSegment {
  start: number;
  end: number;
  title: string;
  reason: string;
  hookStrength: number;
  emotionalScore: number;
  completeness: number;
}

interface AnalysisResult {
  segments: AnalyzedSegment[];
}

/**
 * Analyze a transcript to identify the best clip-worthy segments
 */
export async function analyzeTranscript(
  transcriptSegments: TranscriptSegment[],
  options?: {
    minDuration?: number;
    maxDuration?: number;
    maxClips?: number;
    style?: string;
  },
): Promise<AnalyzedSegment[]> {
  const { minDuration = 15, maxDuration = 90, maxClips = 10, style = "viral" } = options ?? {};

  // Format transcript for AI
  const formattedTranscript = transcriptSegments
    .map((seg) => `[${seg.start.toFixed(1)}s - ${seg.end.toFixed(1)}s] ${seg.text}`)
    .join("\n");

  const userPrompt = `Transcript:
${formattedTranscript}

Requirements:
- Minimum clip duration: ${minDuration} seconds
- Maximum clip duration: ${maxDuration} seconds
- Maximum clips to find: ${maxClips}
- Content style preference: ${style}

Identify the best moments for short-form content.`;

  const result = await chatCompletionJSON<AnalysisResult>(
    PROMPTS.CLIP_ANALYSIS,
    userPrompt,
  );

  // Filter and validate segments
  return result.segments
    .filter((seg) => {
      const duration = seg.end - seg.start;
      return duration >= minDuration && duration <= maxDuration;
    })
    .slice(0, maxClips);
}

/**
 * Quick analysis for a single segment
 */
export async function analyzeSegment(
  text: string,
  start: number,
  end: number,
): Promise<{ hookStrength: number; emotionalScore: number }> {
  const result = await chatCompletionJSON<{ hookStrength: number; emotionalScore: number }>(
    "Rate this video segment for hook strength and emotional impact (1-10 each). Return JSON: { hookStrength, emotionalScore }",
    `[${start}s - ${end}s]: ${text}`,
  );
  return result;
}
