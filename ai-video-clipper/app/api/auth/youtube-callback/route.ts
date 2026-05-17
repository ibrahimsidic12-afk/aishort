import { NextRequest, NextResponse } from "next/server";

import { handleYouTubeOAuthCallback } from "@/lib/auth/youtube";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    // TODO: Validate OAuth state parameter to prevent CSRF
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      // TODO: Handle OAuth denial gracefully
      return NextResponse.redirect(
        new URL("/settings?error=youtube_auth_denied", req.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/settings?error=youtube_auth_invalid", req.url)
      );
    }

    // TODO: Verify state matches stored session state
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // TODO: Exchange code for tokens and store in database
    await handleYouTubeOAuthCallback(user.id, code, state);

    return NextResponse.redirect(
      new URL("/settings?success=youtube_connected", req.url)
    );
  } catch (error) {
    console.error("[AUTH_YOUTUBE_CALLBACK]", error);
    return NextResponse.redirect(
      new URL("/settings?error=youtube_auth_failed", req.url)
    );
  }
}
