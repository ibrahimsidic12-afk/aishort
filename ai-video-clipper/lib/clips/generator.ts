import { prisma } from "../db/prisma";
import { regolo } from "../ai/regolo";
import { parseAIResponse, ClipSegmentsResponseSchema, normalizeClipSegment, type ValidatedClipSegment } from "../ai/schemas";

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
  const { videoId, userId, options = {} } = input;
  const { maxClips = 5, minDuration = 15, maxDuration = 60 } = options;

  // Get video and transcript
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { transcript: true }
  });

  if (!video) {
    throw new Error("Video not found");
  }

  // Create job
  const job = await prisma.job.create({
    data: {
      userId,
      videoId,
      type: "CLIP_GENERATION",
      status: "PROCESSING",
    }
  });

  try {
    let segments: ValidatedClipSegment[] = [];

    // Use AI if transcript exists, otherwise generate evenly-spaced clips
    if (video.transcript?.content) {
      try {
        segments = await identifyClipSegments(
          video.transcript.content,
          video.duration || 0,
          { maxClips, minDuration, maxDuration }
        );
      } catch (aiError) {
        console.warn("[CLIPS] AI generation failed, using fallback:", aiError);
        segments = generateFallbackSegments(video.duration || 600, maxClips, minDuration, maxDuration);
      }
    } else {
      // No transcript — create evenly-spaced clips
      console.log("[CLIPS] No transcript, generating fallback clips");
      segments = generateFallbackSegments(video.duration || 600, maxClips, minDuration, maxDuration);
    }

    // If still no segments, force create some
    if (segments.length === 0) {
      segments = generateFallbackSegments(video.duration || 600, maxClips, minDuration, maxDuration);
    }

    // Create clip records
    const clips = await Promise.all(
      segments.map(async (segment: ValidatedClipSegment, index: number) => {
        return prisma.clip.create({
          data: {
            userId,
            videoId,
            title: segment.title || `Clip ${index + 1}`,
            description: segment.description,
            startTime: segment.startTime,
            endTime: segment.endTime,
            duration: segment.endTime - segment.startTime,
            status: "READY",
            score: segment.score ?? 75,
            viralityScore: segment.viralityScore ?? 70,
            tags: segment.tags || [],
            storageUrl: video.storageUrl,
            thumbnailUrl: video.storageUrl,
          }
        });
      })
    );

    // Update job
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        progress: 100,
        result: { clipIds: clips.map(c => c.id) }
      }
    });

    return {
      id: job.id,
      status: "completed",
      clipIds: clips.map(c => c.id)
    };

  } catch (error) {
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error"
      }
    });
    throw error;
  }
}

/**
 * Generate evenly-spaced clip segments when no transcript is available
 */
function generateFallbackSegments(
  videoDuration: number,
  maxClips: number,
  minDuration: number,
  maxDuration: number
): ValidatedClipSegment[] {
  const segments: ValidatedClipSegment[] = [];
  const clipDuration = Math.min(maxDuration, Math.max(minDuration, 30));
  const totalDuration = Math.max(videoDuration, clipDuration * maxClips);
  const step = totalDuration / maxClips;

  for (let i = 0; i < maxClips; i++) {
    const startTime = Math.max(0, i * step);
    const endTime = Math.min(totalDuration, startTime + clipDuration);
    if (endTime - startTime < 5) continue;

    segments.push({
      startTime,
      endTime,
      title: `Highlight ${i + 1}`,
      description: `Auto-generated clip from ${Math.round(startTime)}s to ${Math.round(endTime)}s`,
      score: 70 + Math.floor(Math.random() * 25),
      viralityScore: 60 + Math.floor(Math.random() * 30),
      tags: ["auto-generated", "highlight"],
    });
  }

  return segments;
}

async function identifyClipSegments(
  transcript: string,
  videoDuration: number,
  options: { maxClips: number; minDuration: number; maxDuration: number }
): Promise<ValidatedClipSegment[]> {
  const prompt = `Analyze this video transcript and identify the ${options.maxClips} most engaging segments for short-form content.

Transcript: ${transcript}

Video Duration: ${videoDuration} seconds

Requirements:
- Each segment should be ${options.minDuration}-${options.maxDuration} seconds
- Focus on moments with high engagement potential
- Look for: emotional peaks, surprising facts, actionable tips, funny moments
- Provide start/end times, titles, descriptions, and virality scores (0-100)

Return JSON array with this structure:
[{
  "startTime": number,
  "endTime": number, 
  "title": "string",
  "description": "string",
  "score": number,
  "viralityScore": number,
  "tags": ["string"]
}]`;

  const response = await regolo.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  
  const segments = parseAIResponse(content, ClipSegmentsResponseSchema, []);
  
  // Normalize and filter segments that exceed video duration
  return segments.map(normalizeClipSegment).filter(
    (seg) => seg.startTime >= 0 && seg.endTime <= videoDuration && seg.endTime > seg.startTime
  );
}

export async function regenerateClips(input: {
  clipIds?: string[];
  videoId?: string;
  userId?: string;
  previousClipIds?: string[];
  options?: Record<string, unknown>;
}): Promise<{ id: string; status: string; clipIds: string[] }> {
  if (input.videoId && input.userId) {
    // Delete existing clips if regenerating for entire video
    if (input.previousClipIds?.length) {
      await prisma.clip.deleteMany({
        where: { id: { in: input.previousClipIds } }
      });
    }
    
    return generateClips({
      videoId: input.videoId,
      userId: input.userId,
      options: input.options as any
    });
  }
  
  throw new Error("Invalid regeneration parameters");
}

export async function getCaptions(input: { clipId: string }): Promise<{
  clipId: string;
  segments: Array<{ start: number; end: number; text: string }>;
  format: string;
  language: string;
}> {
  const clip = await prisma.clip.findUnique({
    where: { id: input.clipId },
    include: { 
      video: { 
        include: { transcript: true } 
      } 
    }
  });

  if (!clip) {
    throw new Error("Clip not found");
  }

  if (!clip.video.transcript) {
    return {
      clipId: input.clipId,
      segments: [],
      format: "srt",
      language: "en",
    };
  }

  // Extract segments for the clip timeframe
  let transcriptSegments: any[] = [];
  try {
    const segs = clip.video.transcript.segments;
    transcriptSegments = typeof segs === "string" ? JSON.parse(segs) : (Array.isArray(segs) ? segs : []);
  } catch {
    transcriptSegments = [];
  }

  const clipSegments = transcriptSegments.filter((seg: any) => 
    seg.start >= clip.startTime && seg.end <= clip.endTime
  ).map((seg: any) => ({
    start: seg.start - clip.startTime,
    end: seg.end - clip.startTime,
    text: seg.text
  }));

  return {
    clipId: input.clipId,
    segments: clipSegments,
    format: "srt",
    language: "en",
  };
}

export async function updateCaptions(input: {
  clipId: string;
  captions: { segments: Array<{ start: number; end: number; text: string }>; style?: Record<string, unknown> };
}): Promise<{ clipId: string; segments: Array<{ start: number; end: number; text: string }>; updatedAt: Date }> {
  const updatedAt = new Date();
  
  await prisma.clip.update({
    where: { id: input.clipId },
    data: {
      captions: input.captions as any,
      updatedAt
    }
  });

  return {
    clipId: input.clipId,
    segments: input.captions.segments,
    updatedAt,
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
  const publication = await prisma.publication.create({
    data: {
      clipId: input.clipId,
      platform: input.platform.toUpperCase() as any,
      status: "PENDING",
    }
  });

  const job = await prisma.job.create({
    data: {
      userId: input.userId,
      type: "PUBLISH",
      status: "QUEUED",
      result: {
        publicationId: publication.id,
        platform: input.platform,
        metadata: input.metadata
      }
    }
  });

  return { 
    id: job.id, 
    status: "queued", 
    platformUrl: "" 
  };
}

export async function deleteClipAssets(input: { storageKey: string | null }): Promise<void> {
  if (!input.storageKey) return;
  
  const { deleteStorageObject } = await import("../storage/presigned");
  await deleteStorageObject(input.storageKey);
  console.log(`[CLIPS] Deleted asset: ${input.storageKey}`);
}
