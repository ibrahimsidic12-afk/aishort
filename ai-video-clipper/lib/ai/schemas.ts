/**
 * Zod schemas for validating AI responses
 * Ensures type safety and graceful error handling for LLM outputs
 */

import { z } from "zod";

// ─── Clip Generation Schemas ─────────────────────────────────────

export const ClipSegmentSchema = z.object({
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  title: z.string().optional().default("Untitled Clip"),
  description: z.string().optional().default(""),
  score: z.number().min(0).max(100).optional().default(50),
  viralityScore: z.number().min(0).max(100).optional().default(50),
  tags: z.array(z.string()).optional().default([]),
});

export const ClipSegmentsResponseSchema = z.array(ClipSegmentSchema);

export type ValidatedClipSegment = z.infer<typeof ClipSegmentSchema>;

// ─── Transcript Segmentation Schemas ─────────────────────────────

export const TranscriptSegmentSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  text: z.string(),
  speaker: z.string().optional(),
});

export const TranscriptSegmentsResponseSchema = z.union([
  z.array(TranscriptSegmentSchema),
  z.object({ segments: z.array(TranscriptSegmentSchema) }),
]);

export type ValidatedTranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;

// ─── Scoring Schemas ─────────────────────────────────────────────

export const ScoredSegmentSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  score: z.number().min(0).max(100),
  reason: z.string().default("No reason provided"),
});

export const ScoredSegmentsResponseSchema = z.object({
  scored_segments: z.array(ScoredSegmentSchema),
});

export type ValidatedScoredSegment = z.infer<typeof ScoredSegmentSchema>;

// ─── Virality Prediction Schemas ─────────────────────────────────

export const ViralityPredictionSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  virality_score: z.number().min(0).max(100),
  reasons: z.array(z.string()).default([]),
});

export const ViralityResponseSchema = z.object({
  predictions: z.array(ViralityPredictionSchema),
});

export type ValidatedViralityPrediction = z.infer<typeof ViralityPredictionSchema>;

// ─── Caption Styling Schemas ─────────────────────────────────────

export const CaptionStyleSchema = z.object({
  fontSize: z.number().min(12).max(128).default(40),
  position: z.string().default("bottom"),
  animation: z.enum(["fade", "slide-up", "pop", "typewriter", "none"]).default("fade"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
});

export const StyledCaptionSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  text: z.string(),
  style: CaptionStyleSchema,
});

export const CaptionsResponseSchema = z.union([
  z.object({ captions: z.array(StyledCaptionSchema) }),
  z.object({ styled_captions: z.array(StyledCaptionSchema) }),
  z.array(StyledCaptionSchema),
]);

export type ValidatedStyledCaption = z.infer<typeof StyledCaptionSchema>;

// ─── Thumbnail Selection Schema ──────────────────────────────────

export const ThumbnailSelectionSchema = z.object({
  frame_index: z.number().int().min(0),
  reason: z.string().default("Default selection"),
});

export type ValidatedThumbnailSelection = z.infer<typeof ThumbnailSelectionSchema>;

// ─── Utility: Safe JSON Parse with Zod ───────────────────────────

/**
 * Safely parse AI response content as JSON and validate with a Zod schema.
 * Handles common issues like markdown code fences, trailing commas, etc.
 */
export function parseAIResponse<T>(
  content: string | null | undefined,
  schema: z.ZodType<T>,
  fallback?: T
): T {
  if (!content) {
    if (fallback !== undefined) return fallback;
    throw new Error("Empty AI response content");
  }

  // Clean common AI response artifacts
  let cleaned = content.trim();

  // Remove markdown code fences
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  // Attempt JSON parse
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (jsonError) {
    // Try to fix trailing commas
    const fixedCommas = cleaned.replace(/,\s*([}\]])/g, "$1");
    try {
      parsed = JSON.parse(fixedCommas);
    } catch {
      if (fallback !== undefined) return fallback;
      throw new Error(
        `Failed to parse AI response as JSON: ${jsonError instanceof Error ? jsonError.message : "Unknown error"}`
      );
    }
  }

  // Validate with Zod
  const result = schema.safeParse(parsed);
  if (result.success) {
    return result.data;
  }

  if (fallback !== undefined) return fallback;

  const issues = result.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
  throw new Error(`AI response validation failed: ${issues}`);
}
