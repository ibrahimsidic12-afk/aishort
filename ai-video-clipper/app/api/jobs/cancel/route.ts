import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { cancelJob } from "@/lib/jobs/queue";
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

    // TODO: Verify job belongs to user
    const job = await db.job.findFirst({
      where: { id: jobId, userId: user.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if ((job.status as any) !== "queued" && (job.status as any) !== "processing") {
      return NextResponse.json(
        { error: "Only queued or processing jobs can be cancelled" },
        { status: 400 }
      );
    }

    // TODO: If job is currently processing, signal worker to stop
    await cancelJob(jobId);

  return NextResponse.json({
    jobId,
    status: "cancelled" as any,
  });
  } catch (error) {
    console.error("[JOBS_CANCEL]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
