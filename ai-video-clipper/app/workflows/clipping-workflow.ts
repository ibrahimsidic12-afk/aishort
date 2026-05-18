/**
 * Clipping Workflow
 * Orchestrates the end-to-end clip generation process:
 * 1. Fetch video and transcript
 * 2. AI analysis for best segments
 * 3. Score and rank segments
 * 4. Generate clip metadata
 * 5. Enqueue rendering jobs
 */

import { prisma } from "@/lib/db/prisma";
import { analyzeTranscript, generateCaptions } from "@/lib/ai/analyze";
import { scoreSegments } from "@/lib/ai/scoring";
import { sendJob } from "@/lib/jobs/queue";

interface ClippingWorkflowInput {
  videoId: string;
  userId: string;
  preferences?: {
    minDuration: number;
    maxDuration: number;
    maxClips: number;
    style: string;
  };
}

export interface ClippingWorkflowResult {
  clipIds: string[];
  segmentsAnalyzed: number;
  processingJobId: string;
}

export async function runClippingWorkflow(input: ClippingWorkflowInput): Promise<ClippingWorkflowResult> {
  const { videoId, userId, preferences } = input;

  console.log(`[Clipping Workflow] Starting for video ${videoId}`);

  // Step 1: Fetch video and transcript
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { transcript: true },
  });

  if (!video) {
    throw new Error(`Video not found: ${videoId}`);
  }

  if (!video.transcript) {
    throw new Error(`Transcript not available for video: ${videoId}`);
  }

  // Update video status
  await prisma.video.update({
    where: { id: videoId },
    data: { status: "PROCESSING" },
  });

  // Step 2: Create processing job
  const job = await prisma.job.create({
    data: {
      userId,
      videoId,
      type: "CLIP_GENERATION",
      status: "PROCESSING",
      startedAt: new Date(),
    },
  });

  try {
    console.log(`[Clipping Workflow] Analyzing transcript with AI...`);

    // Step 3: AI analysis - identify best segments
    const analysis = await analyzeTranscript({
      transcript: video.transcript.content,
      videoContext: video.title,
      preferences: {
        minDuration: preferences?.minDuration ?? 15,
        maxDuration: preferences?.maxDuration ?? 90,
        maxSegments: preferences?.maxClips ?? 5,
      },
    });

    console.log(`[Clipping Workflow] AI identified ${analysis.segments.length} segments`);

    if (analysis.segments.length === 0) {
      throw new Error("No clip-worthy segments found in video");
    }

    // Step 4: Extract text for each segment
    const transcriptSegments = video.transcript.segments as Array<{
      start: number;
      end: number;
      text: string;
    }>;

    const segmentsWithText = analysis.segments.map((segment) => {
      const overlapping = transcriptSegments?.filter(
        (ts) =>
          (ts.start >= segment.start && ts.start < segment.end) ||
          (ts.end > segment.start && ts.end <= segment.end) ||
          (ts.start <= segment.start && ts.end >= segment.end)
      );
      const text = overlapping?.map((ts) => ts.text).join(" ") || "";
      return { ...segment, text };
    });

    // Step 5: Score segments (get scores from analysis results)
    const scoredSegments = analysis.scoredSegments.length > 0
      ? analysis.scoredSegments
      : segmentsWithText.map((s) => ({ start: s.start, end: s.end, score: 50, reason: "" }));

    // Sort by score descending
    const sortedSegments = scoredSegments
      .sort((a, b) => b.score - a.score)
      .slice(0, preferences?.maxClips ?? 5);

    console.log(`[Clipping Workflow] Creating ${sortedSegments.length} clips`);

    // Step 6: Generate clip titles using AI
    const clipTitles = await generateClipTitles(sortedSegments, video.title);

    // Step 7: Create clip records in database
    const clips = await Promise.all(
      sortedSegments.map(async (segment, i) => {
        const clip = await prisma.clip.create({
          data: {
            userId,
            videoId,
            title: clipTitles[i] || `Clip ${i + 1}`,
            startTime: segment.start,
            endTime: segment.end,
            duration: segment.end - segment.start,
            score: segment.score,
            status: "PENDING",
            tags: [],
          },
        });
        return clip;
      })
    );

    // Step 8: Enqueue rendering jobs for each clip
    for (const clip of clips) {
      await sendJob({
        type: "CLIP_RENDERING",
        videoId,
        clipId: clip.id,
        userId,
        options: {
          startTime: clip.startTime,
          endTime: clip.endTime,
          resolution: "1080p",
        },
      });
    }

    // Update job status
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        progress: 100,
        completedAt: new Date(),
        result: { clipIds: clips.map((c) => c.id), count: clips.length },
      },
    });

    // Update video status
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "READY" },
    });

    console.log(`[Clipping Workflow] Completed: ${clips.length} clips created`);

    return {
      clipIds: clips.map((c) => c.id),
      segmentsAnalyzed: analysis.segments.length,
      processingJobId: job.id,
    };

  } catch (error) {
    console.error("[Clipping Workflow] Error:", error);

    // Update job as failed
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

/**
 * Generate catchy titles for clips using AI
 */
async function generateClipTitles(
  segments: Array<{ start: number; end: number; score: number }>,
  videoContext: string
): Promise<string[]> {
  const { regolo } = await import("@/lib/ai/regolo");

  const response = await regolo.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert at creating engaging titles for short-form video clips.

Generate catchy, click-worthy titles (max 60 chars each) that:
- Use power words
- Create curiosity
- Are specific and descriptive
- Work for TikTok/YouTube Shorts

Return JSON array: {"titles": ["Title 1", "Title 2", ...]}`,
      },
      {
        role: "user",
        content: `Video context: ${videoContext}\nSegments: ${JSON.stringify(segments.map((s, i) => ({ index: i + 1, score: s.score })), null, 2)}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const content = response.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);

  return parsed.titles || segments.map((_, i) => `Clip ${i + 1}`);
}
