import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { createProcessingJob } from "@/lib/jobs/queue";
import { db } from "@/lib/db";
import { checkQuota, recordUsage, type UsageType } from "@/lib/quota";

const JOB_TYPE_TO_USAGE: Record<string, UsageType> = {
  TRANSCRIPTION: "TRANSCRIPTION",
  CLIP_GENERATION: "CLIP_GENERATION",
  CLIP_RENDERING: "CLIP_RENDER",
  PUBLISH: "PUBLISH",
};

const VALID_JOB_TYPES = ["TRANSCRIPTION", "CLIP_GENERATION", "CLIP_RENDERING", "THUMBNAIL_GENERATION", "PUBLISH", "CLEANUP"];

export async function POST(req: NextRequest) {
  try {
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

    // Validate job type
    if (!VALID_JOB_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid job type. Must be one of: ${VALID_JOB_TYPES.join(", ")}` },
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

    // Check user's job quota based on plan
    const usageType = JOB_TYPE_TO_USAGE[type];
    if (usageType) {
      const quotaCheck = await checkQuota(user.id, usageType);
      if (!quotaCheck.allowed) {
        return NextResponse.json(
          { error: quotaCheck.reason, remaining: quotaCheck.remaining, limit: quotaCheck.limit },
          { status: 429 }
        );
      }
    }

    const job = await createProcessingJob({
      videoId,
      userId: user.id,
      type,
      options: options || {},
    });

    // Record usage
    if (usageType) {
      await recordUsage(user.id, usageType, { videoId, jobId: job.id });
    }

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
