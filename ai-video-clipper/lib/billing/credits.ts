/**
 * Credit management
 */

import { prisma } from "@/lib/db/prisma";
import { InsufficientCreditsError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";

/**
 * Check if user has enough credits
 */
export async function hasCredits(userId: string, required = 1): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return (user?.credits ?? 0) >= required;
}

/**
 * Deduct credits from a user
 */
export async function deductCredits(userId: string, amount = 1, reason?: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user || user.credits < amount) {
    throw new InsufficientCreditsError(amount, user?.credits ?? 0);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { credits: { decrement: amount } },
  });

  logger.info("Credits deducted", { userId, amount, remaining: updated.credits, reason });
  return updated.credits;
}

/**
 * Add credits to a user
 */
export async function addCredits(userId: string, amount: number, reason?: string): Promise<number> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: amount } },
  });

  logger.info("Credits added", { userId, amount, total: updated.credits, reason });
  return updated.credits;
}

/**
 * Refund credits to a user (e.g., on job failure)
 */
export async function refundCredits(userId: string, amount: number, reason: string): Promise<number> {
  return addCredits(userId, amount, `Refund: ${reason}`);
}

/**
 * Get current credit balance
 */
export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return user?.credits ?? 0;
}

/**
 * Reset credits (e.g., monthly reset for subscription plans)
 */
export async function resetCredits(userId: string, amount: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { credits: amount },
  });
  logger.info("Credits reset", { userId, newBalance: amount });
}
