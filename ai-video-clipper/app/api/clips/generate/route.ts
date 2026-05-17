import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/prisma";
import { generateClipsSchema } from "@/lib/validations/clip";
import { enqueueClipGeneration } from "@/lib/queue/enqueue";
import { deductCredits, hasCredits } from "@/lib/billing/credits";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = generateClipsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { videoId, preferences } = parsed.data;

    // Verify video belongs to user and is ready
    const video = await prisma.video.findFirst({
      where: { id: videoId, userId: user.id },
      include: { transcript: true },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.status !== "READY") {
      return NextResponse.json(
        { error: "Video must be fully processed before generating clips" },
        { status: 400 },
      );
    }

    if (!video.transcript) {
      return NextResponse.json(
        { error: "Video has no transcript. Please wait for transcription to complete." },
        { status: 400 },
      );
    }

    // Check credits
    if (!(await hasCredits(user.id, 1))) {
      return NextResponse.json(
        { error: "Insufficient credits. Please upgrade your plan." },
        { status: 402 },
      );
    }

    // Deduct credit
    await deductCredits(user.id, 1, "clip_generation");

    // Enqueue clip generation job
    const job = await enqueueClipGeneration(videoId, user.id, preferences as any);

    return NextResponse.json({
      jobId: job.id,
      status: "generating",
      videoId,
    });
  } catch (error) {
    console.error("[CLIPS_GENERATE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
