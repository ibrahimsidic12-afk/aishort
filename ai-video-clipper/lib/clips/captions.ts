/**
 * Clip captions management bridge
 */

import { prisma } from "@/lib/db/prisma";

interface CaptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

interface CaptionsData {
  segments: CaptionSegment[];
  language?: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    position?: "top" | "center" | "bottom";
  };
}

/**
 * Get captions for a clip
 */
export async function getCaptions(clipId: string): Promise<CaptionsData | null> {
  const clip = await prisma.clip.findUnique({
    where: { id: clipId },
    select: { captions: true },
  });

  if (!clip) {
    throw new Error(`Clip not found: ${clipId}`);
  }

  if (!clip.captions) {
    return null;
  }

  return clip.captions as unknown as CaptionsData;
}

/**
 * Update captions for a clip
 */
export async function updateCaptions(
  clipId: string,
  data: CaptionsData,
): Promise<void> {
  const clip = await prisma.clip.findUnique({
    where: { id: clipId },
    select: { id: true },
  });

  if (!clip) {
    throw new Error(`Clip not found: ${clipId}`);
  }

  await prisma.clip.update({
    where: { id: clipId },
    data: {
      captions: data as any,
    },
  });
}
