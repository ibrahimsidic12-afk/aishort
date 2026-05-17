/**
 * Virality prediction
 */

import { chatCompletionJSON } from "./client";
import { PROMPTS } from "./prompts";

interface ViralityFactors {
  hook: number;
  emotion: number;
  shareability: number;
  relatability: number;
  pacing: number;
  novelty: number;
}

interface ViralityPrediction {
  overallScore: number;
  factors: ViralityFactors;
  suggestions: string[];
  predictedPlatform: string;
}

/**
 * Predict virality score for a clip
 */
export async function predictVirality(
  transcript: string,
  metadata?: {
    duration?: number;
    title?: string;
    tags?: string[];
  },
): Promise<ViralityPrediction> {
  const userPrompt = `Clip transcript: "${transcript}"
${metadata?.title ? `Title: ${metadata.title}` : ""}
${metadata?.duration ? `Duration: ${metadata.duration}s` : ""}
${metadata?.tags?.length ? `Tags: ${metadata.tags.join(", ")}` : ""}

Predict the virality potential of this clip.`;

  const prediction = await chatCompletionJSON<ViralityPrediction>(
    PROMPTS.VIRALITY_PREDICTION,
    userPrompt,
  );

  return prediction;
}

/**
 * Get quick virality estimate without AI (heuristic-based)
 */
export function estimateViralityHeuristic(params: {
  duration: number;
  hookLength: number;
  wordCount: number;
  hasQuestion: boolean;
  hasNumber: boolean;
}): number {
  let score = 50; // Base score

  // Optimal duration (30-60s)
  if (params.duration >= 30 && params.duration <= 60) score += 10;
  else if (params.duration > 90) score -= 10;

  // Quick hook (under 3 seconds)
  if (params.hookLength <= 3) score += 15;

  // Engagement signals
  if (params.hasQuestion) score += 5;
  if (params.hasNumber) score += 5;

  // Words per second (pacing)
  const wps = params.wordCount / params.duration;
  if (wps >= 2 && wps <= 4) score += 10; // Good pacing
  if (wps > 5) score -= 5; // Too fast

  return Math.min(100, Math.max(0, score));
}
