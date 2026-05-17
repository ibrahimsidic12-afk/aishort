import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing required query parameter: jobId" },
        { status: 400 }
      );
    }

    // TODO: Verify job belongs to user
    const job = await db.job.findFirst({
      where: { id: jobId, userId: user.id },
      include: {
        video: { select: { id: true, fileName: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      jobId: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      video: job.video,
      error: job.error,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    });
  } catch (error) {
    console.error("[JOBS_STATUS]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
