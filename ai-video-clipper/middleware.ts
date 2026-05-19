import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Simple middleware - auth disabled, everyone is anonymous user
 * Redirects auth pages and home to dashboard
 */
export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Redirect auth pages and home directly to dashboard (no login required)
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Apply rate limiting to API routes (if Redis is configured)
  if (pathname.startsWith("/api")) {
    const rateLimitResponse = await applyRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;
  }

  return NextResponse.next();
}

async function applyRateLimit(req: NextRequest): Promise<NextResponse | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  try {
    const { apiRateLimit, generationRateLimit, uploadRateLimit, publishRateLimit, checkRateLimit, getRateLimitHeaders } =
      await import("@/lib/rate-limit");

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anonymous";
    const pathname = req.nextUrl.pathname;

    let limiter = apiRateLimit;
    if (pathname.startsWith("/api/clips/generate") || pathname.startsWith("/api/clips/regenerate")) {
      limiter = generationRateLimit;
    } else if (pathname.startsWith("/api/upload")) {
      limiter = uploadRateLimit;
    } else if (pathname.startsWith("/api/clips/publish") || pathname.startsWith("/api/tiktok/publish")) {
      limiter = publishRateLimit;
    }

    const result = await checkRateLimit(limiter, ip);

    if (!result.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(result) }
      );
    }
    return null;
  } catch (error) {
    console.warn("[Middleware] Rate limit check failed:", error);
    return null;
  }
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/api(.*)"],
};
