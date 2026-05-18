/**
 * AI Scoring Worker
 * Scores and ranks segments for engagement potential
 */

import { scoreForEngagement, predictVirality } from "../../lib/ai/regolo";
import { prisma } from "@/lib/db/prisma";

/**
 * Score a batch of segments with engagement metrics
 */
export async function scoreSegments(
  segments: Array<{ start: number; end: number; text: string }>,
  videoContext?: string
): Promise<Array<{
  start: number;
  end: number;
  score: number;
  reason: string;
  viralityScore?: number;
}>> {
  console.log(`[AI Scoring Worker] Scoring ${segments.length} segments...`);

  // Parallel API calls for performance
  const [scored, virality] = await Promise.all([
    scoreForEngagement(segments, videoContext),
    predictVirality(segments),
  ]);

  // Merge results
  const viralityMap = new Map(
    virality.map(v => [`${v.start}-${v.end}`, v.viralityScore])
  );

  return scored.map(s => ({
    start: s.start,
    end: s.end,
    score: s.score,
    reason: s.reason,
    viralityScore: viralityMap.get(`${s.start}-${s.end}`),
  }));
}

/**
 * Score clips for a specific user/video and save to database
 */
export async function scoreAndSaveClips(
  videoId: string,
  userId: string
): Promise<number> {
  console.log(`[AI Scoring Worker] Scoring clips for video: ${videoId}`);

  // Fetch pending clips
  const clips = await prisma.clip.findMany({
    where: { videoId, userId, status: "PENDING" },
  });

  if (clips.length === 0) {
    console.log("[AI Scoring Worker] No pending clips to score");
    return 0;
  }

  // Score clips
  const segments = clips.map(c => ({
    start: c.startTime,
    end: c.endTime,
    text: "", // TODO: fetch transcript text
  }));

  const scored = await scoreSegments(segments);

  // Update clips with scores
  await Promise.all(clips.map((clip, i) =>
    prisma.clip.update({
      where: { id: clip.id },
      data: {
        score: scored[i]?.score ?? 0,
        viralityScore: scored[i]?.viralityScore,
        status: scored[i]?.score ? "GENERATING" : "PENDING",
      },
    })
  ));

  return clips.length;
}

/**
 * Rank clips by score and suggest publication order
 */
export async function rankClips(
  videoId: string,
  limit: number = 10
): Promise<Array<{ clipId: string; rank: number; score: number }>> {
  const clips = await prisma.clip.findMany({
    where: { videoId, status: { not: "ERROR" } },
    orderBy: [{ viralityScore: "desc" }, { score: "desc" }],
    take: limit,
  });

  return clips.map((clip, index) => ({
    clipId: clip.id,
    rank: index + 1,
    score: clip.score || clip.viralityScore || 0,
  }));
}
