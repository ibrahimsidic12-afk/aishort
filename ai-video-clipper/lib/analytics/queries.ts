/**
 * Analytics queries bridge
 */

import { prisma } from "@/lib/db/prisma";
import { getDashboardMetrics, getOverview } from "@/lib/analytics/metrics";

interface AnalyticsParams {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  type?: "overview" | "clips" | "videos" | "credits";
  limit?: number;
}

interface AnalyticsResult {
  overview?: Awaited<ReturnType<typeof getOverview>>;
  clips?: {
    total: number;
    published: number;
    byStatus: Record<string, number>;
  };
  videos?: {
    total: number;
    totalDuration: number;
    byStatus: Record<string, number>;
  };
  credits?: {
    used: number;
    remaining: number;
    history: Array<{ date: string; amount: number; reason: string }>;
  };
}

/**
 * Get analytics data based on the requested parameters
 */
export async function getAnalytics(params: AnalyticsParams): Promise<AnalyticsResult> {
  const { userId, startDate, endDate, type = "overview" } = params;

  const dateFilter = {
    ...(startDate && { gte: startDate }),
    ...(endDate && { lte: endDate }),
  };
  const hasDateFilter = startDate || endDate;

  switch (type) {
    case "overview": {
      const overview = await getOverview(userId);
      return { overview };
    }

    case "clips": {
      const whereClause = {
        userId,
        ...(hasDateFilter && { createdAt: dateFilter }),
      };

      const [total, published, clips] = await Promise.all([
        prisma.clip.count({ where: whereClause }),
        prisma.clip.count({ where: { ...whereClause, status: "PUBLISHED" } }),
        prisma.clip.groupBy({
          by: ["status"],
          where: whereClause,
          _count: true,
        }),
      ]);

      const byStatus: Record<string, number> = {};
      for (const group of clips) {
        byStatus[group.status] = group._count;
      }

      return { clips: { total, published, byStatus } };
    }

    case "videos": {
      const whereClause = {
        userId,
        ...(hasDateFilter && { createdAt: dateFilter }),
      };

      const [total, videos, durationResult] = await Promise.all([
        prisma.video.count({ where: whereClause }),
        prisma.video.groupBy({
          by: ["status"],
          where: whereClause,
          _count: true,
        }),
        prisma.video.aggregate({
          where: whereClause,
          _sum: { duration: true },
        }),
      ]);

      const byStatus: Record<string, number> = {};
      for (const group of videos) {
        byStatus[group.status] = group._count;
      }

      return {
        videos: {
          total,
          totalDuration: durationResult._sum.duration ?? 0,
          byStatus,
        },
      };
    }

    case "credits": {
      const usageRecords = await prisma.usageRecord.findMany({
        where: {
          userId,
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        orderBy: { createdAt: "desc" },
        take: params.limit ?? 50,
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });

      const totalUsed = await prisma.usageRecord.aggregate({
        where: { userId },
        _sum: { quantity: true },
      });

      return {
        credits: {
          used: totalUsed._sum.quantity ?? 0,
          remaining: user?.credits ?? 0,
          history: usageRecords.map((r) => ({
            date: r.createdAt.toISOString(),
            amount: r.quantity,
            reason: r.description ?? "",
          })),
        },
      };
    }

    default:
      throw new Error(`Unknown analytics type: ${type}`);
  }
}
