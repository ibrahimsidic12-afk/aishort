import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { generateClips } from "@/lib/clips/generator";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { videoId, options } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: "Missing required field: videoId" },
        { status: 400 }
      );
    }

    // TODO: Verify video belongs to user and has been transcribed
    const video = await db.video.findFirst({
      where: { id: videoId, userId: user.id },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if ((video.status as any) !== "transcribed" && (video.status as any) !== "READY") {
      return NextResponse.json(
        { error: "Video must be transcribed before generating clips" },
        { status: 400 }
      );
    }

    // TODO: Check user's clip generation quota
    // TODO: Enqueue clip generation job with AI parameters
    const job = await generateClips({
      videoId,
      userId: user.id,
      options: {
        maxClips: options?.maxClips || 5,
        minDuration: options?.minDuration || 15,
        maxDuration: options?.maxDuration || 60,
        style: options?.style || "engaging",
        aspectRatio: options?.aspectRatio || "9:16",
        ...options,
      },
    });

    return NextResponse.json({
      jobId: job.id,
      status: "generating",
      videoId,
    });
  } catch (error) {
    console.error("[CLIPS_GENERATE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
