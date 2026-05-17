import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/prisma";
import { isValidYouTubeUrl, getVideoInfo, downloadAndUploadToR2 } from "@/lib/youtube/download";
import { enqueueTranscription } from "@/lib/queue/enqueue";
import { recordUsage } from "@/lib/billing/usage";
import { PLAN_LIMITS } from "@/lib/constants";
import { z } from "zod";

const youtubeUrlSchema = z.object({
  url: z.string().url().refine(isValidYouTubeUrl, {
    message: "Invalid YouTube URL. Supported formats: youtube.com/watch, youtu.be, youtube.com/shorts",
  }),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = youtubeUrlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { url } = parsed.data;

    // Step 1: Get video info (fast, no download yet)
    const info = await getVideoInfo(url);

    // Step 2: Check duration against plan limits
    const limits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];
    if (info.duration > limits.maxVideoLength) {
      return NextResponse.json(
        {
          error: `Video is too long (${Math.round(info.duration / 60)} min). Your plan allows up to ${Math.round(limits.maxVideoLength / 60)} min.`,
          info: { title: info.title, duration: info.duration },
        },
        { status: 400 },
      );
    }

    // Step 3: Create video record with PROCESSING status
    const video = await prisma.video.create({
      data: {
        userId: user.id,
        title: info.title,
        description: info.description || null,
        fileName: `${info.id}.mp4`,
        fileSize: info.fileSize || 0,
        duration: info.duration,
        mimeType: "video/mp4",
        storageKey: "", // Will be updated after download
        status: "PROCESSING",
        metadata: {
          source: "youtube",
          youtubeId: info.id,
          youtubeUrl: url,
          channel: info.channel,
          thumbnail: info.thumbnail,
        },
      },
    });

    // Step 4: Download and upload to R2 (this can take a while)
    // For production, this should be a background job. For now, we do it inline
    // with a generous timeout.
    const uploadResult = await downloadAndUploadToR2(url, user.id);

    // Step 5: Update video record with storage info
    await prisma.video.update({
      where: { id: video.id },
      data: {
        storageKey: uploadResult.storageKey,
        fileSize: uploadResult.fileSize,
        status: "PROCESSING",
      },
    });

    // Step 6: Record usage
    await recordUsage(user.id, "VIDEO_UPLOAD", 1, {
      videoId: video.id,
      source: "youtube",
      youtubeId: info.id,
    });

    // Step 7: Enqueue transcription job
    const job = await enqueueTranscription(video.id, user.id);

    return NextResponse.json({
      success: true,
      videoId: video.id,
      jobId: job.id,
      info: {
        title: info.title,
        duration: info.duration,
        channel: info.channel,
        thumbnail: info.thumbnail,
      },
    });
  } catch (error: any) {
    console.error("[UPLOAD_YOUTUBE_URL]", error);

    // Return user-friendly error messages
    if (error.message?.includes("too long") ||
        error.message?.includes("private") ||
        error.message?.includes("Failed to get video info") ||
        error.message?.includes("Failed to download")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET: Preview YouTube video info without downloading
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = req.nextUrl.searchParams.get("url");
    if (!url || !isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { error: "Invalid or missing YouTube URL" },
        { status: 400 },
      );
    }

    const info = await getVideoInfo(url);

    // Check against plan limits
    const limits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];
    const withinLimits = info.duration <= limits.maxVideoLength;

    return NextResponse.json({
      info: {
        id: info.id,
        title: info.title,
        duration: info.duration,
        channel: info.channel,
        thumbnail: info.thumbnail,
        description: info.description,
      },
      withinLimits,
      maxDuration: limits.maxVideoLength,
    });
  } catch (error: any) {
    console.error("[UPLOAD_YOUTUBE_URL_PREVIEW]", error);
    return NextResponse.json(
      { error: error.message || "Failed to get video info" },
      { status: 400 },
    );
  }
}
