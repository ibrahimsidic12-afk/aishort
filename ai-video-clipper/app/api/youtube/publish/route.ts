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

    // TODO: Update publish record in database if publication exists
    // Note: In production, we'd look up the publication by externalId
    // For now, create a new one if the clip exists
    const clip = await db.clip.findFirst({
      where: { videoId: youtubeVideoId, userId: user.id },
    });
    
    if (clip) {
      await db.publication.create({
        data: {
          clipId: clip.id,
          platform: "YOUTUBE",
          status: "PUBLISHED",
          externalId: youtubeVideoId,
          publishedAt: new Date(),
        },
      });
    }

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
