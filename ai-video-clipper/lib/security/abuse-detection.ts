/**
 * Abuse detection logic
 */

import { redis } from "@/lib/queue/redis";
import { logger } from "@/lib/utils/logger";

interface AbuseSignal {
  type: "rapid_uploads" | "excessive_generation" | "spam_publishing" | "suspicious_activity";
  severity: "low" | "medium" | "high";
  details: string;
}

const THRESHOLDS = {
  UPLOADS_PER_HOUR: 20,
  GENERATIONS_PER_HOUR: 30,
  PUBLISHES_PER_HOUR: 15,
  FAILED_JOBS_PER_HOUR: 10,
};

/**
 * Check for abuse patterns
 */
export async function detectAbuse(userId: string): Promise<AbuseSignal[]> {
  const signals: AbuseSignal[] = [];
  const now = Math.floor(Date.now() / 1000);
  const hourWindow = Math.floor(now / 3600);

  // Check rapid uploads
  const uploads = await redis.get<number>(`abuse:uploads:${userId}:${hourWindow}`) ?? 0;
  if (uploads > THRESHOLDS.UPLOADS_PER_HOUR) {
    signals.push({
      type: "rapid_uploads",
      severity: uploads > THRESHOLDS.UPLOADS_PER_HOUR * 2 ? "high" : "medium",
      details: `${uploads} uploads in the last hour`,
    });
  }

  // Check excessive generation
  const generations = await redis.get<number>(`abuse:gen:${userId}:${hourWindow}`) ?? 0;
  if (generations > THRESHOLDS.GENERATIONS_PER_HOUR) {
    signals.push({
      type: "excessive_generation",
      severity: "medium",
      details: `${generations} generations in the last hour`,
    });
  }

  // Check spam publishing
  const publishes = await redis.get<number>(`abuse:publish:${userId}:${hourWindow}`) ?? 0;
  if (publishes > THRESHOLDS.PUBLISHES_PER_HOUR) {
    signals.push({
      type: "spam_publishing",
      severity: "high",
      details: `${publishes} publish attempts in the last hour`,
    });
  }

  return signals;
}

/**
 * Record an activity for abuse tracking
 */
export async function recordActivity(
  userId: string,
  activity: "uploads" | "gen" | "publish" | "failed",
): Promise<void> {
  const hourWindow = Math.floor(Date.now() / 1000 / 3600);
  const key = `abuse:${activity}:${userId}:${hourWindow}`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 7200); // 2 hour TTL
  }
}

/**
 * Flag a user for review
 */
export async function flagUser(userId: string, reason: string): Promise<void> {
  await redis.set(`flagged:${userId}`, { reason, flaggedAt: new Date().toISOString() });
  logger.warn("User flagged for abuse", { userId, reason });
}

/**
 * Check if a user is flagged
 */
export async function isUserFlagged(userId: string): Promise<boolean> {
  const flag = await redis.get(`flagged:${userId}`);
  return !!flag;
}

/**
 * Unflag a user
 */
export async function unflagUser(userId: string): Promise<void> {
  await redis.del(`flagged:${userId}`);
}
