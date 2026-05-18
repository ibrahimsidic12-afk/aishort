import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { publishToTikTok } from "@/lib/platforms/tiktok";
import { getTikTokCredentials } from "@/lib/auth/tiktok";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { clipId } = body;

    if (!clipId) {
      return NextResponse.json(
        { error: "Missing required field: clipId" },
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

    // TODO: Verify user has connected TikTok account
    // const credentials = await getTikTokCredentials(user.id);

    // TODO: Upload and publish via TikTok Content Posting API
    const result = await publishToTikTok({
      clipId,
    });

    // TODO: Store publish record in database
    await db.publication.create({
      data: {
        clipId,
        platform: "TIKTOK",
        status: "PENDING",
      },
    });

    return NextResponse.json({
      tiktokVideoId: (result as any)?.videoId ?? clipId,
      status: "published",
      url: (result as any)?.url,
    });
  } catch (error) {
    console.error("[TIKTOK_PUBLISH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}