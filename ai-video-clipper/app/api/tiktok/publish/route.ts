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
    const { clipId, caption, hashtags, allowComments, allowDuet, allowStitch } =
      body;

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
    const credentials = await getTikTokCredentials(user.id);
    if (!credentials) {
      return NextResponse.json(
        { error: "TikTok account not connected" },
        { status: 400 }
      );
    }

    // TODO: Refresh tokens if expired
    // TODO: Upload and publish via TikTok Content Posting API
    const result = await publishToTikTok({
      credentials,
      clipStorageKey: clip.storageKey,
      metadata: {
        caption: caption || clip.title,
        hashtags: hashtags || [],
        allowComments: allowComments ?? true,
        allowDuet: allowDuet ?? true,
        allowStitch: allowStitch ?? true,
      },
    });

    // TODO: Store publish record in database
    await db.publish.create({
      data: {
        clipId,
        userId: user.id,
        platform: "tiktok",
        platformVideoId: result.videoId,
        platformUrl: result.url,
        status: "published",
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      tiktokVideoId: result.videoId,
      status: "published",
      url: result.url,
    });
  } catch (error) {
    console.error("[TIKTOK_PUBLISH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
