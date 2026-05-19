/**
 * User Quota Management
 * Enforces plan-based limits on usage.
 *
 * All functions are defensive: if a query fails, they degrade gracefully
 * (allow the action / return null stats) instead of bubbling so the request
 * can't return a non-2xx status because of a transient DB issue.
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

export type UsageType =
  | "VIDEO_UPLOAD"
  | "CLIP_GENERATION"
  | "PUBLISH"
  | "TRANSCRIPTION"
  | "CLIP_RENDER";

interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  limit?: number;
  used?: number;
}

// Admin emails that bypass all quota limits
const ADMIN_EMAILS = ["oraclemaster41@gmail.com"];

function startOfCurrentMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function limitForAction(plan: PlanLimits, actionType: UsageType): number {
  switch (actionType) {
    case "VIDEO_UPLOAD":
    case "TRANSCRIPTION":
      return plan.videosPerMonth;
    case "CLIP_GENERATION":
    case "CLIP_RENDER":
      return plan.clipsPerMonth;
    case "PUBLISH":
      return plan.publishesPerMonth;
    default:
      return plan.videosPerMonth;
  }
}

/**
 * Check if a user has remaining quota for a specific action.
 */
export async function checkQuota(
  userId: string,
  actionType: UsageType
): Promise<QuotaCheckResult> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true, credits: true, email: true },
    });

    if (!user) {
      return { allowed: false, reason: "User not found" };
    }

    // Admin bypass — unlimited access.
    if (ADMIN_EMAILS.includes(user.email)) {
      return { allowed: true, remaining: 999999, limit: 999999, used: 0 };
    }

    const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.FREE;
    const limit = limitForAction(limits, actionType);

    const usageCount = await db.usageRecord.count({
      where: {
        userId,
        type: actionType,
        createdAt: { gte: startOfCurrentMonth() },
      },
    });

    const remaining = Math.max(0, limit - usageCount);

    if (usageCount >= limit) {
      return {
        allowed: false,
        reason: `Monthly ${actionType
          .toLowerCase()
          .replace("_", " ")} limit reached (${limit}/${limit}). Upgrade your plan for more.`,
        remaining: 0,
        limit,
        used: usageCount,
      };
    }

    return { allowed: true, remaining, limit, used: usageCount };
  } catch (error) {
    console.error("[QUOTA] checkQuota failed:", error);
    // Allow action if quota check fails (graceful degradation).
    return { allowed: true, remaining: 999, limit: 999, used: 0 };
  }
}

/**
 * Record a usage event. Non-throwing: failures are logged but never
 * propagate so the calling request stays 2xx.
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
        // Prisma's `Json` column accepts plain JSON values. We cast via
        // `unknown` to satisfy its `InputJsonValue` type without coupling
        // this file to Prisma's namespace export, which isn't always
        // available before `prisma generate` runs.
        metadata: metadata as unknown as object,
      },
    });
  } catch (error) {
    console.error("[QUOTA] recordUsage failed:", error);
  }
}

/**
 * Check if a video file size is within plan limits.
 */
export function checkVideoSizeLimit(
  plan: string,
  fileSizeBytes: number
): QuotaCheckResult {
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
 * Check if video duration is within plan limits.
 */
export function checkVideoDurationLimit(
  plan: string,
  durationSeconds: number
): QuotaCheckResult {
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
 * Get user's current monthly usage stats. Returns `null` on any error so
 * callers (e.g., the dashboard page) can render a fallback.
 */
export async function getUserUsageStats(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true, credits: true, email: true },
    });

    if (!user) return null;

    if (ADMIN_EMAILS.includes(user.email)) {
      return {
        plan: "BUSINESS",
        credits: 999999,
        usage: {
          videos: { used: 0, limit: 999999 },
          clips: { used: 0, limit: 999999 },
          publishes: { used: 0, limit: 999999 },
        },
        limits: PLAN_LIMITS.BUSINESS,
      };
    }

    const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.FREE;
    const since = startOfCurrentMonth();

    const [videos, clips, publishes] = await Promise.all([
      db.usageRecord.count({
        where: { userId, type: "VIDEO_UPLOAD", createdAt: { gte: since } },
      }),
      db.usageRecord.count({
        where: { userId, type: "CLIP_GENERATION", createdAt: { gte: since } },
      }),
      db.usageRecord.count({
        where: { userId, type: "PUBLISH", createdAt: { gte: since } },
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
