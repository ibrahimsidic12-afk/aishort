import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { publishYouTubeVideo } from "@/lib/platforms/youtube";
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
    // const credentials = await getYouTubeCredentials(user.id);

    // TODO: Update video visibility/status via YouTube Data API
    const result = await publishYouTubeVideo({
      youtubeVideoId,
      visibility: visibility || "public",
      scheduledAt: scheduledAt || null,
    } as any);

    // TODO: Update publish record in database
    await (db as any).publication.update({
      where: { id: youtubeVideoId },
      data: {
        status: "published",
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      youtubeVideoId,
      status: "published",
      url: (result as any)?.url,
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
