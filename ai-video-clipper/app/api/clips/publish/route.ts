import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { publishClip } from "@/lib/clips/publish";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { clipId, platform, metadata } = body;

    if (!clipId || !platform) {
      return NextResponse.json(
        { error: "Missing required fields: clipId, platform" },
        { status: 400 }
      );
    }

    // TODO: Validate platform (youtube, tiktok, instagram)
    const validPlatforms = ["youtube", "tiktok", "instagram"];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${validPlatforms.join(", ")}` },
        { status: 400 }
      );
    }

    // TODO: Verify clip belongs to user
    const clip = await db.clip.findFirst({
      where: { id: clipId, userId: user.id },
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // TODO: Verify user has connected the target platform account
    // TODO: Check publishing quota for user's plan

    const result = await publishClip({
      clipId,
      userId: user.id,
      platform,
      metadata: {
        title: metadata?.title || clip.title,
        description: metadata?.description || "",
        tags: metadata?.tags || [],
        visibility: metadata?.visibility || "public",
      },
    });

    return NextResponse.json({
      publishId: result.id,
      platform,
      status: result.status,
      platformUrl: result.platformUrl,
    });
  } catch (error) {
    console.error("[CLIPS_PUBLISH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
