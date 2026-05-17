import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { uploadToYouTube } from "@/lib/platforms/youtube";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { clipId, title, description } = body;

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
    // const credentials = await getYouTubeCredentials(user.id);

    // TODO: Refresh tokens if expired
    // TODO: Upload video to YouTube via YouTube Data API v3
    const result = await uploadToYouTube({
      clipStorageKey: clip.storageKey ?? undefined,
      title: title || clip.title,
      description: description || "",
    } as any);

    return NextResponse.json({
      youtubeVideoId: (result as any)?.videoId,
      status: (result as any)?.status,
      uploadUrl: (result as any)?.uploadUrl,
    });
  } catch (error) {
    console.error("[YOUTUBE_UPLOAD]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
