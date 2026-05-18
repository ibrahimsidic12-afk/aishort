import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getPublicUrl } from "@/lib/storage/presigned";
import { checkQuota, recordUsage } from "@/lib/quota";
import { createProcessingJob, sendJob } from "@/lib/jobs/queue";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { key, fileName, fileSize, mimeType } = body;

    if (!key || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields: key, fileName" },
        { status: 400 }
      );
    }

    // Check upload quota
    const quotaCheck = await checkQuota(user.id, "VIDEO_UPLOAD");
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { error: quotaCheck.reason },
        { status: 429 }
      );
    }

    // Create video record in database
    const storageUrl = getPublicUrl(key);
    const video = await db.video.create({
      data: {
        userId: user.id,
        storageKey: key,
        storageUrl,
        fileName,
        fileSize: fileSize || 0,
        title: fileName.replace(/\.[^/.]+$/, "") || "Untitled",
        mimeType: mimeType || "video/mp4",
        status: "UPLOADING",
      },
    });

    // Record usage
    await recordUsage(user.id, "VIDEO_UPLOAD", { videoId: video.id });

    // Create transcription job
    const job = await createProcessingJob({
      videoId: video.id,
      userId: user.id,
      type: "TRANSCRIPTION",
    });

    // Send job to queue for processing
    await sendJob({
      jobId: job.id,
      type: "TRANSCRIPTION",
      videoId: video.id,
      userId: user.id,
    });

    // Update video status
    await db.video.update({
      where: { id: video.id },
      data: { status: "PROCESSING" },
    });

    return NextResponse.json({
      success: true,
      videoId: video.id,
      jobId: job.id,
      status: "processing",
    });
  } catch (error) {
    console.error("[UPLOAD_COMPLETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
