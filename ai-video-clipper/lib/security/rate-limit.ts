/**
 * Rate limiting with Redis
 */

import { redis } from "@/lib/queue/redis";
import { RateLimitError } from "@/lib/utils/errors";
import { RATE_LIMITS } from "@/lib/constants";

interface RateLimitConfig {
  requests: number;
  window: number; // seconds
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // unix timestamp
}

/**
 * Check rate limit for a given key
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `ratelimit:${key}:${Math.floor(now / config.window)}`;

  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.expire(windowKey, config.window);
  }

  const remaining = Math.max(0, config.requests - count);
  const resetAt = (Math.floor(now / config.window) + 1) * config.window;

  return {
    allowed: count <= config.requests,
    remaining,
    resetAt,
  };
}

/**
 * Rate limit by user ID
 */
export async function rateLimitUser(
  userId: string,
  operation: keyof typeof RATE_LIMITS,
): Promise<void> {
  const config = RATE_LIMITS[operation];
  const result = await checkRateLimit(`user:${userId}:${operation}`, config);

  if (!result.allowed) {
    throw new RateLimitError(result.resetAt - Math.floor(Date.now() / 1000));
  }
}

/**
 * Rate limit by IP address
 */
export async function rateLimitIP(
  ip: string,
  operation: keyof typeof RATE_LIMITS,
): Promise<void> {
  const config = RATE_LIMITS[operation];
  const result = await checkRateLimit(`ip:${ip}:${operation}`, config);

  if (!result.allowed) {
    throw new RateLimitError(result.resetAt - Math.floor(Date.now() / 1000));
  }
}

/**
 * Get remaining requests for a key
 */
export async function getRemainingRequests(
  key: string,
  config: RateLimitConfig,
): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `ratelimit:${key}:${Math.floor(now / config.window)}`;
  const count = (await redis.get<number>(windowKey)) ?? 0;
  return Math.max(0, config.requests - count);
}
