/**
 * Upstash Redis client
 */

import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Cache helpers
 */
export async function getCache<T>(key: string): Promise<T | null> {
  return redis.get<T>(key);
}

export async function setCache<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  if (ttlSeconds) {
    await redis.set(key, value, { ex: ttlSeconds });
  } else {
    await redis.set(key, value);
  }
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}

export async function incrementCounter(key: string, ttlSeconds?: number): Promise<number> {
  const count = await redis.incr(key);
  if (ttlSeconds && count === 1) {
    await redis.expire(key, ttlSeconds);
  }
  return count;
}

export async function getCounter(key: string): Promise<number> {
  return (await redis.get<number>(key)) ?? 0;
}
