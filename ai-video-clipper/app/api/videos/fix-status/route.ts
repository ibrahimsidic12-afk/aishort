import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

/**
 * POST /api/videos/fix-status
 * Fixes videos stuck in PROCESSING status when their transcription job is COMPLETED.
 * This handles the edge case where the job completed but video status wasn't updated.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find all user's videos stuck in PROCESSING/TRANSCRIBING that have completed transcription jobs
    const stuckVideos = await db.video.findMany({
      where: {
        userId: user.id,
        status: { in: ["PROCESSING", "TRANSCRIBING", "UPLOADING"] },
      },
      include: {
        jobs: {
          where: { type: "TRANSCRIPTION" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    let fixed = 0;
    for (const video of stuckVideos) {
      const latestJob = video.jobs[0];
      if (latestJob?.status === "COMPLETED") {
        await db.video.update({
          where: { id: video.id },
          data: { status: "READY" },
        });
        fixed++;
      } else if (latestJob?.status === "FAILED") {
        await db.video.update({
          where: { id: video.id },
          data: { status: "ERROR" },
        });
        fixed++;
      }
    }

    return NextResponse.json({
      success: true,
      fixed,
      total: stuckVideos.length,
    });
  } catch (error) {
    console.error("[FIX_STATUS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
