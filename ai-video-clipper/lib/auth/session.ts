/**
 * Session utilities
 */

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import type { User } from "@/types";

export interface SessionData {
  userId: string;
  clerkId: string;
  email: string;
  plan: string;
  credits: number;
}

export async function getSession(): Promise<SessionData | null> {
  const { userId } = auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      plan: true,
      credits: true,
    },
  });

  if (!user) return null;

  return {
    userId: user.id,
    clerkId: user.clerkId,
    email: user.email,
    plan: user.plan,
    credits: user.credits,
  };
}

export async function getUserWithSubscription(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    include: {
      subscription: true,
      youtubeTokens: { select: { channelId: true, expiresAt: true } },
      tiktokTokens: { select: { openId: true, expiresAt: true } },
    },
  });
}

export async function getUserById(userId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  return user as User | null;
}


// Re-export getCurrentUser from clerk.ts so routes importing from "@/lib/auth/session" work
export { getCurrentUser } from "./clerk";
