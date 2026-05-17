/**
 * Usage tracking
 */

import { prisma } from "@/lib/db/prisma";
import type { UsageType } from "@/types";

/**
 * Record a usage event
 */
export async function recordUsage(
  userId: string,
  type: UsageType,
  quantity = 1,
  metadata?: Record<string, unknown>,
) {
  await prisma.usageRecord.create({
    data: {
      userId,
      type,
      quantity,
      metadata: metadata as any,
    },
  });
}

/**
 * Get usage summary for current billing period
 */
export async function getMonthlyUsage(userId: string): Promise<Record<UsageType, number>> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const records = await prisma.usageRecord.groupBy({
    by: ["type"],
    where: {
      userId,
      createdAt: { gte: startOfMonth },
    },
    _sum: { quantity: true },
  });

  const usage: Record<string, number> = {
    VIDEO_UPLOAD: 0,
    TRANSCRIPTION: 0,
    CLIP_GENERATION: 0,
    CLIP_RENDER: 0,
    PUBLISH: 0,
  };

  for (const record of records) {
    usage[record.type] = record._sum.quantity ?? 0;
  }

  return usage as Record<UsageType, number>;
}

/**
 * Get total usage for a specific type
 */
export async function getUsageCount(userId: string, type: UsageType, since?: Date): Promise<number> {
  const result = await prisma.usageRecord.aggregate({
    where: {
      userId,
      type,
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    _sum: { quantity: true },
  });
  return result._sum.quantity ?? 0;
}

/**
 * Check if user has exceeded usage limit
 */
export async function hasExceededLimit(
  userId: string,
  type: UsageType,
  limit: number,
): Promise<boolean> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await getUsageCount(userId, type, startOfMonth);
  return count >= limit;
}
