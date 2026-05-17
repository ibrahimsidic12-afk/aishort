/**
 * Metrics aggregation
 */

import { prisma } from "@/lib/db/prisma";
import type { DashboardMetrics, AnalyticsOverview, MetricPoint } from "@/types";

/**
 * Get dashboard overview metrics for a user
 */
export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  const [overview, recentClips, clipsByDay, topTags] = await Promise.all([
    getOverview(userId),
    getRecentClipPerformance(userId),
    getClipsByDay(userId, 30),
    getTopTags(userId),
  ]);

  return { overview, recentClips, clipsByDay, topTags };
}

/**
 * Get analytics overview
 */
export async function getOverview(userId: string): Promise<AnalyticsOverview> {
  const [totalVideos, totalClips, totalPublished, user] = await Promise.all([
    prisma.video.count({ where: { userId } }),
    prisma.clip.count({ where: { userId } }),
    prisma.clip.count({ where: { userId, status: "PUBLISHED" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { credits: true } }),
  ]);

  // Calculate credits used from usage records
  const usageResult = await prisma.usageRecord.aggregate({
    where: { userId },
    _sum: { quantity: true },
  });

  return {
    totalVideos,
    totalClips,
    totalPublished,
    creditsUsed: usageResult._sum.quantity ?? 0,
    creditsRemaining: user?.credits ?? 0,
  };
}

/**
 * Get clips created per day
 */
async function getClipsByDay(userId: string, days: number): Promise<MetricPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const clips = await prisma.clip.findMany({
    where: { userId, createdAt: { gte: startDate } },
    select: { createdAt: true },
  });

  const dayMap = new Map<string, number>();
  for (let d = 0; d < days; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    dayMap.set(date.toISOString().split("T")[0], 0);
  }

  for (const clip of clips) {
    const date = clip.createdAt.toISOString().split("T")[0];
    dayMap.set(date, (dayMap.get(date) ?? 0) + 1);
  }

  return Array.from(dayMap.entries())
    .map(([date, value]) => ({ date, value }))
    .reverse();
}

/**
 * Get top used tags
 */
async function getTopTags(userId: string): Promise<{ tag: string; count: number }[]> {
  const clips = await prisma.clip.findMany({
    where: { userId },
    select: { tags: true },
  });

  const tagCounts = new Map<string, number>();
  for (const clip of clips) {
    for (const tag of clip.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Get recent clip performance (placeholder — real data from platform APIs)
 */
async function getRecentClipPerformance(userId: string) {
  const published = await prisma.clip.findMany({
    where: { userId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 10,
    include: { publications: true },
  });

  return published.map((clip) => ({
    clipId: clip.id,
    title: clip.title,
    platform: clip.publications[0]?.platform ?? "unknown",
    views: 0, // TODO: Fetch from platform API
    likes: 0,
    shares: 0,
    comments: 0,
    retention: 0,
    publishedAt: clip.publishedAt ?? clip.createdAt,
  }));
}
