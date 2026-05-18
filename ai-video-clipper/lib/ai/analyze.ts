/**
 * AI Analysis Module
 * Uses Regolo AI for transcript analysis, scoring, and caption generation
 */

import { segmentTranscript, scoreForEngagement, predictVirality, type Segment } from "./regolo";
import { parseAIResponse, CaptionsResponseSchema, ThumbnailSelectionSchema, type ValidatedStyledCaption } from "./schemas";

/**
 * Analyze transcript and identify best segments for clipping
 */
export async function analyzeTranscript(input: {
  transcript: string;
  videoContext?: string;
  preferences?: {
    minDuration?: number;
    maxDuration?: number;
    maxSegments?: number;
  };
}): Promise<{
  segments: Segment[];
  scoredSegments: Array<{ start: number; end: number; score: number; reason: string }>;
}> {
  console.log("[AI] Analyzing transcript...");

  // Step 1: Identify segments
  const segments = await segmentTranscript(input.transcript, input.preferences);

  if (segments.length === 0) {
    console.log("[AI] No segments identified");
    return { segments: [], scoredSegments: [] };
  }

  // Step 2: Score for engagement
  const scoredSegments = await scoreForEngagement(segments, input.videoContext);

  // Sort by score descending
  scoredSegments.sort((a, b) => b.score - a.score);

  return {
    segments,
    scoredSegments,
  };
}

/**
 * Score existing segments for engagement potential
 */
export async function scoreSegments(input: Array<{
  start: number;
  end: number;
  text: string;
}>): Promise<Array<{ start: number; end: number; score: number; reason: string }>> {
  console.log(`[AI] Scoring ${input.length} segments...`);

  const segments = input.map(s => ({
    start: s.start,
    end: s.end,
    text: s.text,
  }));

  const scored = await scoreForEngagement(segments);

  return scored.map(s => ({
    start: s.start,
    end: s.end,
    score: s.score,
    reason: s.reason,
  }));
}

/**
 * Generate caption styling suggestions based on content
 */
export async function generateCaptions(input: {
  segments: Array<{ start: number; end: number; text: string }>;
}): Promise<Array<{
  start: number;
  end: number;
  text: string;
  style: {
    fontSize: number;
    position: string;
    animation: string;
    color: string;
  };
}>> {
  console.log("[AI] Generating caption styles...");

  // Import regolo for caption generation
  const { regolo } = await import("./regolo");

  const response = await regolo.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert at creating engaging captions for short-form video content.

For each segment, determine optimal caption styling:
- fontSize: 32-64 pixels (larger for emphasis)
- position: "bottom" or "center"
- animation: "fade" | "slide-up" | "pop" | "typewriter"
- color: "#FFFFFF" (white) or "#FFFF00" (yellow for highlights)

Return JSON array:
[
  {
    "start": 0,
    "end": 30,
    "text": "actual text from segment",
    "style": {
      "fontSize": 40,
      "position": "bottom",
      "animation": "pop",
      "color": "#FFFFFF"
    }
  }
]`,
      },
      {
        role: "user",
        content: `Generate caption styles for:\n${JSON.stringify(input.segments, null, 2)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const content = response.choices[0]?.message?.content || '{}';
  
  const parsed = parseAIResponse(content, CaptionsResponseSchema, []);
  
  // Normalize response shape and ensure all fields have values
  let segments: Array<{ start: number; end: number; text: string; style: { fontSize: number; position: string; animation: string; color: string } }> = [];
  
  const rawSegments = Array.isArray(parsed)
    ? parsed
    : "captions" in parsed
    ? parsed.captions
    : "styled_captions" in parsed
    ? parsed.styled_captions
    : [];

  segments = rawSegments.map((seg) => ({
    start: seg.start,
    end: seg.end,
    text: seg.text,
    style: {
      fontSize: seg.style.fontSize,
      position: seg.style.position,
      animation: seg.style.animation,
      color: seg.style.color,
    },
  }));

  return segments;
}

/**
 * Select best thumbnail from video frames
 */
export async function selectThumbnail(input: {
  frames: string[];
  context?: string;
}): Promise<{
  frameIndex: number;
  reason: string;
}> {
  if (!input.frames.length) {
    return { frameIndex: 0, reason: "No frames available" };
  }

  console.log(`[AI] Selecting thumbnail from ${input.frames.length} frames...`);

  const { regolo } = await import("./regolo");

  const response = await regolo.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert at selecting compelling thumbnails for video content.

Choose the best frame based on:
- Visual impact and clarity
- Expressiveness of subjects
- Brand/logo visibility
- Text readability (if any)
- Overall appeal

Return JSON:
{
  "frame_index": 0,
  "reason": "Why this frame is best"
}`,
      },
      {
        role: "user",
        content: `Select best thumbnail. Frames available: frame_000.jpg through frame_${String(input.frames.length - 1).padStart(3, '0')}.jpg\nContext: ${input.context || "General video"}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content2 = response.choices[0]?.message?.content || '{}';
  const parsed = parseAIResponse(content2, ThumbnailSelectionSchema, { frame_index: 0, reason: "Default selection" });

  return {
    frameIndex: Math.min(Math.max(parsed.frame_index, 0), input.frames.length - 1),
    reason: parsed.reason,
  };
}

export { segmentTranscript, scoreForEngagement, predictVirality };
