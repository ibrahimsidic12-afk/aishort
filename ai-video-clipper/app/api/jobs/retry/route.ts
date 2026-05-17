import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { retryJob } from "@/lib/jobs/queue";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing required field: jobId" },
        { status: 400 }
      );
    }

    // TODO: Verify job belongs to user and is in a failed state
    const job = await db.job.findFirst({
      where: { id: jobId, userId: user.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "failed") {
      return NextResponse.json(
        { error: "Only failed jobs can be retried" },
        { status: 400 }
      );
    }

    // TODO: Check retry limit (max 3 retries)
    const retriedJob = await retryJob(jobId);

    return NextResponse.json({
      jobId: retriedJob.id,
      status: retriedJob.status,
      retryCount: retriedJob.retryCount,
    });
  } catch (error) {
    console.error("[JOBS_RETRY]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
