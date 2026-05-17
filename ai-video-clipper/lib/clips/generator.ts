import { prisma } from "../db/prisma";

export async function generateClips(input: {
  videoId: string;
  userId: string;
  options?: {
    maxClips?: number;
    minDuration?: number;
    maxDuration?: number;
    style?: string;
    aspectRatio?: string;
    prompt?: string;
  };
}): Promise<{ id: string; status: string; clipIds: string[] }> {
  console.warn("[CLIPS] generateClips: stub");
  const clips = await prisma.clip.createMany({
    data: [],
    skipDuplicates: true,
  });
  return { id: `job_${input.videoId}`, status: "queued", clipIds: [] };
}

export async function regenerateClips(input: {
  clipIds?: string[];
  videoId?: string;
  userId?: string;
  previousClipIds?: string[];
  options?: Record<string, unknown>;
}): Promise<{ id: string; status: string; clipIds: string[] }> {
  console.warn("[CLIPS] regenerateClips: stub");
  return { id: `regen_${input.clipIds?.[0] ?? "unknown"}`, status: "queued", clipIds: input.clipIds ?? [] };
}

export async function getCaptions(input: { clipId: string }): Promise<{
  clipId: string;
  segments: Array<{ start: number; end: number; text: string }>;
  format: string;
  language: string;
}> {
  console.warn("[CLIPS] getCaptions: stub");
  return {
    clipId: input.clipId,
    segments: [],
    format: "srt",
    language: "en",
  };
}

export async function updateCaptions(input: {
  clipId: string;
  captions: { segments: Array<{ start: number; end: number; text: string }>; style?: Record<string, unknown> };
}): Promise<{ clipId: string; segments: Array<{ start: number; end: number; text: string }>; updatedAt: Date }> {
  console.warn("[CLIPS] updateCaptions: stub");
  return {
    clipId: input.clipId,
    segments: input.captions.segments,
    updatedAt: new Date(),
  };
}

export async function publishClip(input: {
  clipId: string;
  userId: string;
  platform: string;
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    visibility?: string;
  };
}): Promise<{ id: string; status: string; platformUrl: string }> {
  console.warn("[CLIPS] publishClip: stub", { clipId: input.clipId, platform: input.platform });
  return { id: `pub_${input.clipId}`, status: "pending", platformUrl: "" };
}

export async function deleteClipAssets(input: { storageKey: string | null }): Promise<void> {
  console.warn("[CLIPS] deleteClipAssets: stub", input.storageKey);
}
