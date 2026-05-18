import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "../db";

export interface SessionUser {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: "FREE" | "PRO" | "BUSINESS";
  credits: number;
  connectedAccounts: Record<string, unknown>;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    // Try to find existing user in DB
    let user: any = null;
    try {
      user = await db.user.findUnique({
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
    } catch (dbError) {
      console.error("[AUTH] DB query failed:", dbError);
      // DB might not be connected — return null but don't crash
      return null;
    }

    // If user doesn't exist in DB yet (webhook hasn't fired), create them
    if (!user) {
      try {
        const clerkUser = await currentUser();
        if (!clerkUser) return null;

        const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";
        const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

        user = await db.user.create({
          data: {
            clerkId: userId,
            email,
            name,
            avatarUrl: clerkUser.imageUrl || null,
            plan: "FREE",
            credits: 10,
          },
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
      } catch (createError) {
        console.error("[AUTH] Failed to create user:", createError);
        return null;
      }
    }

    return { ...user, connectedAccounts: {} };
  } catch (error) {
    console.error("[AUTH] getCurrentUser failed:", error);
    return null;
  }
}
