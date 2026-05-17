import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = req.nextUrl.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Missing required query parameter: jobId" },
        { status: 400 },
      );
    }

    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: user.id },
      include: {
        video: { select: { id: true, title: true, fileName: true, status: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // If clip generation is complete, include generated clip IDs
    let clipIds: string[] | undefined;
    if (job.type === "CLIP_GENERATION" && job.status === "COMPLETED" && job.result) {
      clipIds = (job.result as any).clipIds;
    }

    return NextResponse.json({
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      error: job.error,
      result: job.result,
      clipIds,
      video: job.video,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
    });
  } catch (error) {
    console.error("[JOBS_STATUS]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
