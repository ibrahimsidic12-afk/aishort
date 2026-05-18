/**
 * Zod schemas for validating AI responses
 * Ensures type safety and graceful error handling for LLM outputs
 */

import { z } from "zod";

// ─── Clip Generation Schemas ─────────────────────────────────────

export const ClipSegmentSchema = z.object({
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  title: z.string().optional(),
  description: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  viralityScore: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
});

export const ClipSegmentsResponseSchema = z.array(ClipSegmentSchema);

export interface ValidatedClipSegment {
  startTime: number;
  endTime: number;
  title: string;
  description: string;
  score: number;
  viralityScore: number;
  tags: string[];
}

/** Normalize a raw parsed clip segment with defaults */
export function normalizeClipSegment(raw: z.infer<typeof ClipSegmentSchema>): ValidatedClipSegment {
  return {
    startTime: raw.startTime,
    endTime: raw.endTime,
    title: raw.title ?? "Untitled Clip",
    description: raw.description ?? "",
    score: raw.score ?? 50,
    viralityScore: raw.viralityScore ?? 50,
    tags: raw.tags ?? [],
  };
}

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
  reason: z.string().optional(),
});

export const ScoredSegmentsResponseSchema = z.object({
  scored_segments: z.array(ScoredSegmentSchema),
});

export interface ValidatedScoredSegment {
  start: number;
  end: number;
  score: number;
  reason: string;
}

/** Normalize a raw scored segment with defaults */
export function normalizeScoredSegment(raw: z.infer<typeof ScoredSegmentSchema>): ValidatedScoredSegment {
  return {
    start: raw.start,
    end: raw.end,
    score: raw.score,
    reason: raw.reason ?? "No reason provided",
  };
}

// ─── Virality Prediction Schemas ─────────────────────────────────

export const ViralityPredictionSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0),
  virality_score: z.number().min(0).max(100),
  reasons: z.array(z.string()).optional(),
});

export const ViralityResponseSchema = z.object({
  predictions: z.array(ViralityPredictionSchema),
});

export interface ValidatedViralityPrediction {
  start: number;
  end: number;
  virality_score: number;
  reasons: string[];
}

/** Normalize a raw virality prediction with defaults */
export function normalizeViralityPrediction(raw: z.infer<typeof ViralityPredictionSchema>): ValidatedViralityPrediction {
  return {
    start: raw.start,
    end: raw.end,
    virality_score: raw.virality_score,
    reasons: raw.reasons ?? [],
  };
}

// ─── Caption Styling Schemas ─────────────────────────────────────

export const CaptionStyleSchema = z.object({
  fontSize: z.number().optional(),
  position: z.string().optional(),
  animation: z.string().optional(),
  color: z.string().optional(),
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

export interface ValidatedStyledCaption {
  start: number;
  end: number;
  text: string;
  style: {
    fontSize: number;
    position: string;
    animation: string;
    color: string;
  };
}

/** Normalize a raw styled caption with defaults */
export function normalizeStyledCaption(raw: z.infer<typeof StyledCaptionSchema>): ValidatedStyledCaption {
  return {
    start: raw.start,
    end: raw.end,
    text: raw.text,
    style: {
      fontSize: raw.style.fontSize ?? 40,
      position: raw.style.position ?? "bottom",
      animation: raw.style.animation ?? "fade",
      color: raw.style.color ?? "#FFFFFF",
    },
  };
}

// ─── Thumbnail Selection Schema ──────────────────────────────────

export const ThumbnailSelectionSchema = z.object({
  frame_index: z.number().int().min(0),
  reason: z.string().optional(),
});

export interface ValidatedThumbnailSelection {
  frame_index: number;
  reason: string;
}

/** Normalize a raw thumbnail selection with defaults */
export function normalizeThumbnailSelection(raw: z.infer<typeof ThumbnailSelectionSchema>): ValidatedThumbnailSelection {
  return {
    frame_index: raw.frame_index,
    reason: raw.reason ?? "Default selection",
  };
}

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
