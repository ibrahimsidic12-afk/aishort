import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/prisma";
import { enqueueTranscription } from "@/lib/queue/enqueue";
import { completeUploadSchema } from "@/lib/validations/upload";
import { recordUsage } from "@/lib/billing/usage";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = completeUploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { key, fileName, title, description } = parsed.data;

    // Create video record in database
    const video = await prisma.video.create({
      data: {
        userId: user.id,
        title: title || fileName.replace(/\.[^.]+$/, ""),
        description: description || null,
        fileName,
        fileSize: 0, // Will be updated after processing
        mimeType: "video/mp4",
        storageKey: key,
        status: "PROCESSING",
      },
    });

    // Record usage
    await recordUsage(user.id, "VIDEO_UPLOAD", 1, { videoId: video.id });

    // Enqueue transcription job
    const job = await enqueueTranscription(video.id, user.id);

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
      { status: 500 },
    );
  }
}
