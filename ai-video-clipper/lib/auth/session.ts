import { auth } from "@clerk/nextjs/server";
import { db } from "../db";

export interface SessionUser {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: "FREE" | "PRO" | "BUSINESS";
  credits: number;
  stripeCustomerId: string | null;
  connectedAccounts: Record<string, unknown>;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const { userId } = await auth();
  if (!userId) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      avatarUrl: true,
      plan: true,
      credits: true,
    },
  });
  if (!user) return null;
  return { ...user, stripeCustomerId: null, connectedAccounts: {} };
}
