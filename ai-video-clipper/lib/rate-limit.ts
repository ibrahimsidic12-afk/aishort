/**
 * Rate Limiting using Upstash Redis
 * Provides configurable rate limiters for different API routes
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * General API rate limiter
 * 60 requests per minute per user/IP
 */
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "ratelimit:api",
});

/**
 * Upload rate limiter
 * 10 uploads per hour per user
 */
export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "ratelimit:upload",
});

/**
 * AI/Generation rate limiter
 * 20 generation requests per hour per user
 */
export const generationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  analytics: true,
  prefix: "ratelimit:generation",
});

/**
 * Publishing rate limiter
 * 30 publishes per hour per user
 */
export const publishRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 h"),
  analytics: true,
  prefix: "ratelimit:publish",
});

/**
 * Auth rate limiter (stricter for security)
 * 5 attempts per minute per IP
 */
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(5, "1 m"),
  analytics: true,
  prefix: "ratelimit:auth",
});

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Check rate limit and return standardized result
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<RateLimitResult> {
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Get rate limit headers for responses
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}
