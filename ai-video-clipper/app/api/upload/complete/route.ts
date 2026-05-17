import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { confirmUpload } from "@/lib/storage/upload";
import { triggerVideoProcessing } from "@/lib/jobs/processing";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { key, fileName, fileSize, duration } = body;

    if (!key || !fileName) {
      return NextResponse.json(
        { error: "Missing required fields: key, fileName" },
        { status: 400 }
      );
    }

    // TODO: Verify the upload actually completed in storage
    await confirmUpload(key);

    // TODO: Create video record in database
    const video: { id: string } = await db.video.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        userId: user.id,
        storageKey: key,
        fileName,
        fileSize,
        duration,
        title: fileName || "Untitled",
        mimeType: "video/mp4",
        status: "uploaded" as any,
      },
    } as any);

    // TODO: Trigger background processing (transcription, analysis)
    const job = await triggerVideoProcessing({
      videoId: video.id,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      videoId: video.id,
      jobId: job.jobId?.[0] || `job_${video.id}`,
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
