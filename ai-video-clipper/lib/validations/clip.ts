/**
 * Clip validation schemas (Zod)
 */

import { z } from "zod";
import { CLIP_DURATION } from "@/lib/constants";

export const generateClipsSchema = z.object({
  videoId: z.string().min(1),
  preferences: z
    .object({
      minDuration: z.number().min(CLIP_DURATION.MIN).max(CLIP_DURATION.MAX).optional(),
      maxDuration: z.number().min(CLIP_DURATION.MIN).max(CLIP_DURATION.MAX).optional(),
      maxClips: z.number().int().min(1).max(25).optional(),
      style: z.enum(["viral", "educational", "entertainment", "auto"]).optional(),
      platforms: z
        .array(z.enum(["youtube", "tiktok", "instagram"]))
        .optional(),
    })
    .optional(),
});

export const regenerateClipsSchema = z.object({
  videoId: z.string().min(1),
  preferences: z.object({
    minDuration: z.number().min(CLIP_DURATION.MIN).max(CLIP_DURATION.MAX).optional(),
    maxDuration: z.number().min(CLIP_DURATION.MIN).max(CLIP_DURATION.MAX).optional(),
    maxClips: z.number().int().min(1).max(25).optional(),
    style: z.enum(["viral", "educational", "entertainment", "auto"]).optional(),
  }),
});

export const updateClipSchema = z.object({
  clipId: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  startTime: z.number().min(0).optional(),
  endTime: z.number().min(0).optional(),
});

export const renderClipSchema = z.object({
  clipId: z.string().min(1),
  settings: z.object({
    resolution: z.enum(["720p", "1080p", "4k"]).default("1080p"),
    format: z.enum(["mp4", "webm"]).default("mp4"),
    quality: z.number().min(1).max(100).default(85),
    includeCaptions: z.boolean().default(true),
  }),
});

export const publishClipSchema = z.object({
  clipId: z.string().min(1),
  platform: z.enum(["youtube", "tiktok", "instagram"]),
  options: z
    .object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(5000).optional(),
      tags: z.array(z.string()).max(30).optional(),
      visibility: z.enum(["public", "private", "unlisted"]).optional(),
    })
    .optional(),
});

export const deleteClipSchema = z.object({
  clipId: z.string().min(1),
});

export type GenerateClipsInput = z.infer<typeof generateClipsSchema>;
export type PublishClipInput = z.infer<typeof publishClipSchema>;
