import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { createProcessingJob } from "@/lib/jobs/queue";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { videoId, type, options } = body;

    if (!videoId || !type) {
      return NextResponse.json(
        { error: "Missing required fields: videoId, type" },
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

    // TODO: Check user's job quota based on plan
    // TODO: Validate job type (transcription, clip_generation, etc.)

    const job = await createProcessingJob({
      videoId,
      userId: user.id,
      type,
      options: options || {},
    });

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      type: job.type,
      createdAt: job.createdAt,
    });
  } catch (error) {
    console.error("[JOBS_CREATE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
