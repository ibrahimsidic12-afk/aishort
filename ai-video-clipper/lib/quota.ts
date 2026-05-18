/**
 * User Quota Management
 * Enforces plan-based limits on usage
 */

import { db } from "./db";

interface PlanLimits {
  videosPerMonth: number;
  clipsPerMonth: number;
  publishesPerMonth: number;
  maxVideoSizeMB: number;
  maxVideoDurationMin: number;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE: {
    videosPerMonth: 3,
    clipsPerMonth: 15,
    publishesPerMonth: 5,
    maxVideoSizeMB: 500,
    maxVideoDurationMin: 30,
  },
  PRO: {
    videosPerMonth: 30,
    clipsPerMonth: 150,
    publishesPerMonth: 100,
    maxVideoSizeMB: 5000,
    maxVideoDurationMin: 180,
  },
  BUSINESS: {
    videosPerMonth: 100,
    clipsPerMonth: 500,
    publishesPerMonth: 500,
    maxVideoSizeMB: 10000,
    maxVideoDurationMin: 360,
  },
};

export type UsageType = "VIDEO_UPLOAD" | "CLIP_GENERATION" | "PUBLISH" | "TRANSCRIPTION" | "CLIP_RENDER";

interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  limit?: number;
  used?: number;
}

/**
 * Check if a user has remaining quota for a specific action
 */
export async function checkQuota(
  userId: string,
  actionType: UsageType
): Promise<QuotaCheckResult> {
  try {
  // Get user's plan
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, credits: true },
  });

  if (!user) {
    return { allowed: false, reason: "User not found" };
  }

  const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.FREE;

  // Get usage for current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usageCount = await db.usageRecord.count({
    where: {
      userId,
      type: actionType,
      createdAt: { gte: startOfMonth },
    },
  });

  // Determine the limit based on action type
  let limit: number;
  switch (actionType) {
    case "VIDEO_UPLOAD":
      limit = limits.videosPerMonth;
      break;
    case "CLIP_GENERATION":
    case "CLIP_RENDER":
      limit = limits.clipsPerMonth;
      break;
    case "PUBLISH":
      limit = limits.publishesPerMonth;
      break;
    case "TRANSCRIPTION":
      limit = limits.videosPerMonth; // Tied to video uploads
      break;
    default:
      limit = limits.videosPerMonth;
  }

  const remaining = Math.max(0, limit - usageCount);

  if (usageCount >= limit) {
    return {
      allowed: false,
      reason: `Monthly ${actionType.toLowerCase().replace("_", " ")} limit reached (${limit}/${limit}). Upgrade your plan for more.`,
      remaining: 0,
      limit,
      used: usageCount,
    };
  }

  return {
    allowed: true,
    remaining,
    limit,
    used: usageCount,
  };
  } catch (error) {
    console.error("[QUOTA] checkQuota failed:", error);
    // Allow action if quota check fails (graceful degradation)
    return { allowed: true, remaining: 999, limit: 999, used: 0 };
  }
}

/**
 * Record a usage event
 */
export async function recordUsage(
  userId: string,
  type: UsageType,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await db.usageRecord.create({
      data: {
        userId,
        type,
        metadata: metadata as object | undefined,
    },
  });
  } catch (error) {
    console.error("[QUOTA] recordUsage failed:", error);
    // Don't crash if usage recording fails
  }
}

/**
 * Check if a video size is within plan limits
 */
export function checkVideoSizeLimit(plan: string, fileSizeBytes: number): QuotaCheckResult {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
  const fileSizeMB = fileSizeBytes / (1024 * 1024);

  if (fileSizeMB > limits.maxVideoSizeMB) {
    return {
      allowed: false,
      reason: `File size (${Math.round(fileSizeMB)}MB) exceeds your plan limit (${limits.maxVideoSizeMB}MB).`,
    };
  }

  return { allowed: true };
}

/**
 * Check if video duration is within plan limits
 */
export function checkVideoDurationLimit(plan: string, durationSeconds: number): QuotaCheckResult {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
  const durationMin = durationSeconds / 60;

  if (durationMin > limits.maxVideoDurationMin) {
    return {
      allowed: false,
      reason: `Video duration (${Math.round(durationMin)} min) exceeds your plan limit (${limits.maxVideoDurationMin} min).`,
    };
  }

  return { allowed: true };
}

/**
 * Get user's current usage stats
 */
export async function getUserUsageStats(userId: string) {
  try {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, credits: true },
  });

  if (!user) return null;

  const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.FREE;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [videos, clips, publishes] = await Promise.all([
    db.usageRecord.count({
      where: { userId, type: "VIDEO_UPLOAD", createdAt: { gte: startOfMonth } },
    }),
    db.usageRecord.count({
      where: { userId, type: "CLIP_GENERATION", createdAt: { gte: startOfMonth } },
    }),
    db.usageRecord.count({
      where: { userId, type: "PUBLISH", createdAt: { gte: startOfMonth } },
    }),
  ]);

  return {
    plan: user.plan,
    credits: user.credits,
    usage: {
      videos: { used: videos, limit: limits.videosPerMonth },
      clips: { used: clips, limit: limits.clipsPerMonth },
      publishes: { used: publishes, limit: limits.publishesPerMonth },
    },
    limits,
  };
  } catch (error) {
    console.error("[QUOTA] getUserUsageStats failed:", error);
    return null;
  }
}
