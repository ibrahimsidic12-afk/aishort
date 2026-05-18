import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/uploads(.*)",
  "/videos(.*)",
  "/clips(.*)",
  "/review(.*)",
  "/analytics(.*)",
  "/team(.*)",
  "/settings(.*)",
]);

const isAuthRoute = createRouteMatcher([
  "/login(.*)",
  "/signup(.*)",
  "/forgot-password(.*)",
]);

const isPublicHomePage = createRouteMatcher(["/"]);

const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, protect } = auth();

  // Redirect authenticated users away from auth pages and home to dashboard
  if (userId && (isAuthRoute(req) || isPublicHomePage(req))) {
    const dashboardUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Protect dashboard routes - redirects unauthenticated users to sign-in
  if (isProtectedRoute(req)) {
    protect();
  }

  // Apply rate limiting to API routes
  if (isApiRoute(req)) {
    const rateLimitResponse = await applyRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;
  }
});

/**
 * Apply rate limiting to API requests using Upstash Redis.
 * Returns a 429 response if rate limit is exceeded, otherwise null.
 */
async function applyRateLimit(req: NextRequest): Promise<NextResponse | null> {
  // Skip rate limiting if Redis is not configured
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  try {
    // Dynamic import to avoid issues when env vars aren't set
    const { apiRateLimit, generationRateLimit, uploadRateLimit, publishRateLimit, checkRateLimit, getRateLimitHeaders } =
      await import("@/lib/rate-limit");

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anonymous";
    const pathname = req.nextUrl.pathname;

    // Select appropriate rate limiter based on route
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
        {
          status: 429,
          headers: getRateLimitHeaders(result),
        }
      );
    }

    return null;
  } catch (error) {
    // If rate limiting fails, allow the request through
    console.warn("[Middleware] Rate limit check failed:", error);
    return null;
  }
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/api(.*)"],
};
