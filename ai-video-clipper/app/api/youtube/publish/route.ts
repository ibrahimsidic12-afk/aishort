import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { publishYouTubeVideo } from "@/lib/platforms/youtube";
import { getYouTubeCredentials } from "@/lib/auth/youtube";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { youtubeVideoId, visibility, scheduledAt } = body;

    if (!youtubeVideoId) {
      return NextResponse.json(
        { error: "Missing required field: youtubeVideoId" },
        { status: 400 }
      );
    }

    // TODO: Verify user has connected YouTube account
    const credentials = await getYouTubeCredentials(user.id);
    if (!credentials) {
      return NextResponse.json(
        { error: "YouTube account not connected" },
        { status: 400 }
      );
    }

    // TODO: Update video visibility/status via YouTube Data API
    const result = await publishYouTubeVideo({
      credentials,
      youtubeVideoId,
      visibility: visibility || "public",
      scheduledAt: scheduledAt || null,
    });

    // TODO: Update publish record in database
    await db.publish.update({
      where: { platformVideoId: youtubeVideoId },
      data: {
        status: "published",
        publishedAt: new Date(),
        platformUrl: result.url,
      },
    });

    return NextResponse.json({
      youtubeVideoId,
      status: "published",
      url: result.url,
      publishedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[YOUTUBE_PUBLISH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
