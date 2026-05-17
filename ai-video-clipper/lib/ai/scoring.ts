/**
 * Clip scoring algorithm
 */

interface ScoringFactors {
  hookStrength: number; // 0-1: How strong is the opening
  emotionalImpact: number; // 0-1: Emotional resonance
  pacing: number; // 0-1: Delivery speed and rhythm
  completeness: number; // 0-1: Self-contained narrative
  novelty: number; // 0-1: Uniqueness of content
  audioQuality: number; // 0-1: Clear audio, no background noise
}

interface ScoredClip {
  score: number; // 0-1 weighted final score
  factors: ScoringFactors;
  breakdown: Record<string, number>;
}

// Weights for each factor
const WEIGHTS = {
  hookStrength: 0.25,
  emotionalImpact: 0.2,
  pacing: 0.15,
  completeness: 0.2,
  novelty: 0.1,
  audioQuality: 0.1,
} as const;

/**
 * Calculate a weighted clip score from individual factors
 */
export function calculateScore(factors: ScoringFactors): ScoredClip {
  const breakdown: Record<string, number> = {};
  let totalScore = 0;

  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const factorValue = factors[key as keyof ScoringFactors];
    const weighted = factorValue * weight;
    breakdown[key] = weighted;
    totalScore += weighted;
  }

  return {
    score: Math.min(1, Math.max(0, totalScore)),
    factors,
    breakdown,
  };
}

/**
 * Score a clip based on transcript analysis results
 */
export function scoreFromAnalysis(analysis: {
  hookStrength: number;
  emotionalScore: number;
  completeness: number;
  duration: number;
}): number {
  // Normalize scores from 1-10 to 0-1
  const hook = analysis.hookStrength / 10;
  const emotion = analysis.emotionalScore / 10;
  const completeness = analysis.completeness / 10;

  // Duration penalty: prefer 30-60 seconds
  let durationBonus = 1;
  if (analysis.duration < 20) durationBonus = 0.7;
  else if (analysis.duration > 120) durationBonus = 0.8;
  else if (analysis.duration >= 30 && analysis.duration <= 60) durationBonus = 1.1;

  const rawScore = hook * 0.3 + emotion * 0.3 + completeness * 0.4;
  return Math.min(1, rawScore * durationBonus);
}

/**
 * Rank clips by score descending
 */
export function rankClips<T extends { score: number }>(clips: T[]): T[] {
  return [...clips].sort((a, b) => b.score - a.score);
}
