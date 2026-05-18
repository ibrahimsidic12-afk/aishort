import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { generateClips } from "@/lib/clips/generator";
import { db } from "@/lib/db";
import { checkQuota, recordUsage } from "@/lib/quota";

export async function POST(req: NextRequest) {
  try {
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

    // Verify video belongs to user
    const video = await db.video.findFirst({
      where: { id: videoId, userId: user.id },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.status !== "READY") {
      return NextResponse.json(
        { error: "Video must be transcribed before generating clips" },
        { status: 400 }
      );
    }

    // Check user's clip generation quota
    const quotaCheck = await checkQuota(user.id, "CLIP_GENERATION");
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { error: quotaCheck.reason, remaining: quotaCheck.remaining, limit: quotaCheck.limit },
        { status: 429 }
      );
    }

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

    // Record usage
    await recordUsage(user.id, "CLIP_GENERATION", { videoId, clipCount: job.clipIds.length });

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
