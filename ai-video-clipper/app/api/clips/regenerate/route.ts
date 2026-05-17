import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { regenerateClips } from "@/lib/clips/generator";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { videoId, clipIds, options } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: "Missing required field: videoId" },
        { status: 400 }
      );
    }

    // TODO: Verify video belongs to user
    const video = await db.video.findFirst({
      where: { id: videoId, userId: user.id },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // TODO: Check user's regeneration quota
    // TODO: Optionally delete old clips if clipIds specified
    const job = await regenerateClips({
      videoId,
      userId: user.id,
      previousClipIds: clipIds || [],
      options: {
        maxClips: options?.maxClips || 5,
        minDuration: options?.minDuration || 15,
        maxDuration: options?.maxDuration || 60,
        style: options?.style || "engaging",
        aspectRatio: options?.aspectRatio || "9:16",
        prompt: options?.prompt,
        ...options,
      },
    });

    return NextResponse.json({
      jobId: job.id,
      status: "regenerating",
      videoId,
    });
  } catch (error) {
    console.error("[CLIPS_REGENERATE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
