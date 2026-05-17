/**
 * Permission checks
 */

import { PLAN_LIMITS } from "@/lib/constants";
import type { User, Plan } from "@/types";

export function canUpload(user: User, fileSize: number): boolean {
  const limits = PLAN_LIMITS[user.plan as Plan];
  return fileSize <= limits.maxFileSize;
}

export function canGenerateClips(user: User): boolean {
  return user.credits > 0;
}

export function canPublish(user: User, platform: string): boolean {
  const limits = PLAN_LIMITS[user.plan as Plan];
  return limits.platforms.includes(platform);
}

export function canAccessTeam(user: User): boolean {
  return user.plan === "BUSINESS";
}

export function getMaxClipsPerVideo(user: User): number {
  const limits = PLAN_LIMITS[user.plan as Plan];
  return limits.clipsPerVideo;
}

export function getMaxVideoLength(user: User): number {
  const limits = PLAN_LIMITS[user.plan as Plan];
  return limits.maxVideoLength;
}

// Assertion variants that throw
export function assertCanUpload(user: User, fileSize: number): void {
  if (!canUpload(user, fileSize)) {
    throw new Error(`File too large for ${user.plan} plan`);
  }
}

export function assertCanGenerate(user: User): void {
  if (!canGenerateClips(user)) {
    throw new Error("Insufficient credits");
  }
}

export function assertCanPublish(user: User, platform: string): void {
  if (!canPublish(user, platform)) {
    throw new Error(`Publishing to ${platform} requires a plan upgrade`);
  }
}
