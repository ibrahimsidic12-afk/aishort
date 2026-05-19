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

const ANONYMOUS_USER_CLERK_ID = "anonymous-shared-user";
const ANONYMOUS_USER_EMAIL = "anonymous@aishort.local";

/**
 * Returns a shared anonymous user (no auth required).
 * Auto-creates the user in DB on first call.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    let user: any = null;

    try {
      user = await db.user.findUnique({
        where: { clerkId: ANONYMOUS_USER_CLERK_ID },
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
      return null;
    }

    if (!user) {
      try {
        user = await db.user.create({
          data: {
            clerkId: ANONYMOUS_USER_CLERK_ID,
            email: ANONYMOUS_USER_EMAIL,
            name: "Anonymous User",
            avatarUrl: null,
            plan: "BUSINESS",
            credits: 999999,
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
        console.error("[AUTH] Failed to create anonymous user:", createError);
        return null;
      }
    }

    return { ...user, connectedAccounts: {} };
  } catch (error) {
    console.error("[AUTH] getCurrentUser failed:", error);
    return null;
  }
}
