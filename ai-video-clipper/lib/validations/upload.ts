/**
 * Upload validation schemas (Zod)
 */

import { z } from "zod";
import { SUPPORTED_VIDEO_FORMATS } from "@/lib/constants";

export const presignedUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.string().refine(
    (type) => (SUPPORTED_VIDEO_FORMATS as readonly string[]).includes(type),
    { message: "Unsupported video format" },
  ),
  fileSize: z.number().int().positive().max(5_000_000_000, "File too large (max 5GB)"),
});

export const completeUploadSchema = z.object({
  key: z.string().min(1),
  fileName: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
});

export const multipartInitSchema = z.object({
  action: z.literal("initiate"),
  fileName: z.string().min(1),
  fileType: z.string().min(1),
});

export const multipartPresignSchema = z.object({
  action: z.literal("presign-part"),
  key: z.string().min(1),
  uploadId: z.string().min(1),
  partNumber: z.number().int().min(1).max(10000),
});

export const multipartCompleteSchema = z.object({
  action: z.literal("complete"),
  key: z.string().min(1),
  uploadId: z.string().min(1),
  parts: z.array(
    z.object({
      partNumber: z.number().int().min(1),
      etag: z.string().min(1),
    }),
  ).min(1),
});

export type PresignedUploadInput = z.infer<typeof presignedUploadSchema>;
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;
