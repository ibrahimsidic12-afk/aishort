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

    // Verify video belongs to user and include transcript
    const video = await db.video.findFirst({
      where: { id: videoId, userId: user.id },
      include: { transcript: { select: { id: true, content: true } } },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Allow generation if video is READY or PROCESSING (with completed job)
    if (video.status !== "READY" && video.status !== "PROCESSING") {
      return NextResponse.json(
        { error: `Video must be transcribed before generating clips. Current status: ${video.status}` },
        { status: 400 }
      );
    }

    // If video is still PROCESSING but has no transcript, check if we can fix it
    if (!video.transcript) {
      // Check if transcription job completed
      const completedJob = await db.job.findFirst({
        where: { videoId, type: "TRANSCRIPTION", status: "COMPLETED" },
      });

      if (completedJob) {
        // Job completed but no transcript was saved — create a placeholder
        await db.video.update({ where: { id: videoId }, data: { status: "READY" } });
      }

      return NextResponse.json(
        { error: "Transcript not available yet. The video needs to be transcribed first. Please wait for transcription to complete or re-upload the video." },
        { status: 400 }
      );
    }

    // Mark video as READY if it was stuck
    if (video.status === "PROCESSING") {
      await db.video.update({ where: { id: videoId }, data: { status: "READY" } });
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
      clipCount: job.clipIds.length,
      videoId,
    });
  } catch (error) {
    console.error("[CLIPS_GENERATE]", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
