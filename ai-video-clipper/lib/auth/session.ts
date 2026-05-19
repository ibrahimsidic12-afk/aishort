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

const ANONYMOUS_USER_SELECT = {
  id: true,
  clerkId: true,
  email: true,
  name: true,
  avatarUrl: true,
  plan: true,
  credits: true,
} as const;

/**
 * Returns the shared anonymous user (no auth required).
 *
 * Uses Prisma `upsert` so concurrent first-time requests can't race against
 * each other and trigger a P2002 unique-constraint violation on
 * `clerkId`/`email`. Previous implementation did `findUnique` then
 * `create` — non-atomic, so two parallel cold-start RSC requests would
 * both see `null` and both attempt `create`, with one failing.
 *
 * Returns `null` only if the database itself is unreachable; callers
 * should render a soft fallback rather than throwing.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const user = await db.user.upsert({
      where: { clerkId: ANONYMOUS_USER_CLERK_ID },
      update: {}, // no-op; we just want the existing row
      create: {
        clerkId: ANONYMOUS_USER_CLERK_ID,
        email: ANONYMOUS_USER_EMAIL,
        name: "Anonymous User",
        avatarUrl: null,
        plan: "BUSINESS",
        credits: 999999,
      },
      select: ANONYMOUS_USER_SELECT,
    });

    return { ...user, connectedAccounts: {} };
  } catch (error) {
    // The most common failure here is a DB connection error during cold
    // start (Neon/Supabase serverless wake-up) or migrations being out of
    // sync. Don't bubble — let the caller render a graceful fallback so
    // the request never returns a non-2xx status.
    console.error("[AUTH] getCurrentUser failed:", error);
    return null;
  }
}
