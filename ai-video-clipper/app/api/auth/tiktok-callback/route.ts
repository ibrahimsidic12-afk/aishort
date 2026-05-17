import { NextRequest, NextResponse } from "next/server";

import { handleTikTokOAuthCallback } from "@/lib/auth/tiktok";
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
        new URL("/settings?error=tiktok_auth_denied", req.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/settings?error=tiktok_auth_invalid", req.url)
      );
    }

    // TODO: Verify state matches stored session state
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // TODO: Exchange code for tokens and store in database
    await handleTikTokOAuthCallback(user.id, code, state);

    return NextResponse.redirect(
      new URL("/settings?success=tiktok_connected", req.url)
    );
  } catch (error) {
    console.error("[AUTH_TIKTOK_CALLBACK]", error);
    return NextResponse.redirect(
      new URL("/settings?error=tiktok_auth_failed", req.url)
    );
  }
}
