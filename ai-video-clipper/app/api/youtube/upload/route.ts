import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { uploadToYouTube } from "@/lib/platforms/youtube";
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
    const { clipId, title, description, tags, visibility, categoryId } = body;

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

    // TODO: Verify user has connected YouTube account
    const credentials = await getYouTubeCredentials(user.id);
    if (!credentials) {
      return NextResponse.json(
        { error: "YouTube account not connected" },
        { status: 400 }
      );
    }

    // TODO: Refresh tokens if expired
    // TODO: Upload video to YouTube via YouTube Data API v3
    const result = await uploadToYouTube({
      credentials,
      clipStorageKey: clip.storageKey,
      metadata: {
        title: title || clip.title,
        description: description || "",
        tags: tags || [],
        visibility: visibility || "private",
        categoryId: categoryId || "22",
      },
    });

    return NextResponse.json({
      youtubeVideoId: result.videoId,
      status: result.status,
      uploadUrl: result.uploadUrl,
    });
  } catch (error) {
    console.error("[YOUTUBE_UPLOAD]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
