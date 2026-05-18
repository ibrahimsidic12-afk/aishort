import OpenAI from "openai";
import {
  parseAIResponse,
  TranscriptSegmentsResponseSchema,
  TranscriptSegmentSchema,
  ScoredSegmentsResponseSchema,
  ViralityResponseSchema,
  type ValidatedTranscriptSegment,
  type ValidatedScoredSegment,
  type ValidatedViralityPrediction,
} from "./schemas";
import { z } from "zod";

/**
 * Regolo AI Client
 * OpenAI-compatible client configured for Regolo API
 */
export const regolo = new OpenAI({
  apiKey: process.env.REGOLO_API_KEY,
  baseURL: process.env.REGOLO_BASE_URL || "https://api.regolo.ai/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "AI Video Clipper",
  },
});

export interface Segment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface ScoredSegment {
  start: number;
  end: number;
  score: number;
  reason: string;
}

export interface ViralityPrediction {
  start: number;
  end: number;
  viralityScore: number;
  reasons: string[];
}

/**
 * Segment transcript into logical clip-worthy segments
 */
export async function segmentTranscript(
  transcript: string,
  options?: {
    minDuration?: number;
    maxDuration?: number;
    maxSegments?: number;
  }
): Promise<Segment[]> {
  const minDuration = options?.minDuration ?? 15;
  const maxDuration = options?.maxDuration ?? 90;
  const maxSegments = options?.maxSegments ?? 10;

  const response = await regolo.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert video editor specializing in identifying engaging moments for short-form content (TikTok, YouTube Shorts, Instagram Reels).

Analyze the transcript and identify segments suitable for clipping. Look for:
- High-energy moments
- Key insights or valuable information
- Emotional peaks
- Memorable quotes or statements
- Natural topic transitions
- Hook-worthy openings

Each segment must be between ${minDuration} and ${maxDuration} seconds.

Return ONLY a JSON array with this exact structure:
[
  {"start": 0, "end": 45, "text": "transcript excerpt"}
]

Return up to ${maxSegments} segments, ordered by engagement potential.`,
      },
      {
        role: "user",
        content: `Transcript:\n${transcript}\n\nIdentify the best segments for short-form clips:`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content || "[]";
  
  // Parse and validate with Zod - handles both array and object responses
  const parsed = parseAIResponse(content, TranscriptSegmentsResponseSchema, []);
  
  // Normalize: if it came as an object with .segments, extract the array
  if (Array.isArray(parsed)) return parsed;
  if ("segments" in parsed) return parsed.segments;

  return [];
}

/**
 * Score segments for engagement potential
 */
export async function scoreForEngagement(
  segments: Segment[],
  videoContext?: string
): Promise<ScoredSegment[]> {
  const context = videoContext || "General content";

  const response = await regolo.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert at predicting viral potential of video segments.

Score each segment from 0-100 based on:
- Hook strength (first 3 seconds)
- Information density
- Emotional impact
- Shareability
- Completeness (self-contained story)
- Call-to-action potential

Return JSON with scores and reasoning:
{
  "scored_segments": [
    {"start": 0, "end": 45, "score": 85, "reason": "Strong hook with valuable tip"},
    ...
  ]
}`,
      },
      {
        role: "user",
        content: `Video context: ${context}\n\nSegments to score:\n${JSON.stringify(segments, null, 2)}\n\nScore each segment:`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const content = response.choices[0]?.message?.content || '{}';
  const parsed = parseAIResponse(content, ScoredSegmentsResponseSchema, { scored_segments: [] });

  return parsed.scored_segments;
}

/**
 * Predict virality scores for segments
 */
export async function predictVirality(
  segments: Segment[]
): Promise<ViralityPrediction[]> {
  const response = await regolo.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `Predict which video segments are most likely to go viral on social media.

Consider:
- Trend potential
- Relatability
- Shock factor
- Humor
- Emotional triggers
- Educational value

Return JSON:
{
  "predictions": [
    {
      "start": 0,
      "end": 45,
      "virality_score": 92,
      "reasons": ["Highly relatable situation", "Universal humor"]
    }
  ]
}`,
      },
      {
        role: "user",
        content: `Analyze these segments for viral potential:\n${JSON.stringify(segments, null, 2)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.6,
  });

  const content = response.choices[0]?.message?.content || '{}';
  const parsed = parseAIResponse(content, ViralityResponseSchema, { predictions: [] });

  return parsed.predictions.map((p) => ({
    start: p.start,
    end: p.end,
    viralityScore: p.virality_score,
    reasons: p.reasons,
  }));
}

export default regolo;
