import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { checkQuota, recordUsage } from "@/lib/quota";
import { createProcessingJob, sendJob } from "@/lib/jobs/queue";

const YOUTUBE_URL_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const ImportYouTubeSchema = z.object({
  url: z.string().min(1, "YouTube URL is required"),
  title: z.string().max(200).optional(),
});

function extractVideoId(url: string): string | null {
  const match = url.match(YOUTUBE_URL_REGEX);
  return match ? match[1] : null;
}

function cleanTitle(title: string): string {
  return title.replace(/[^\w\s\-_.()]/g, "").trim().slice(0, 200) || "YouTube Video";
}

export async function POST(req: NextRequest) {
  try {
    // Get anonymous user (no auth required)
    const dbUser = await getCurrentUser();
    if (!dbUser) {
      return NextResponse.json(
        { error: "Database connection failed.", code: "DB_ERROR" },
        { status: 503 }
      );
    }

    const body = await req.json();

    // Validate request
    const parseResult = ImportYouTubeSchema.safeParse(body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i) => i.message).join("; ");
      return NextResponse.json(
        { error: issues, code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const { url, title } = parseResult.data;

    // Extract YouTube video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL. Please provide a valid YouTube video link.", code: "INVALID_YOUTUBE_URL" },
        { status: 400 }
      );
    }

    // Check upload quota
    const quotaCheck = await checkQuota(dbUser.id, "VIDEO_UPLOAD");
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { error: quotaCheck.reason, code: "QUOTA_EXCEEDED", remaining: quotaCheck.remaining },
        { status: 429 }
      );
    }

    // Check if already imported
    const existing = await db.video.findFirst({
      where: { userId: dbUser.id, storageKey: `youtube:${videoId}` },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This YouTube video has already been imported.", code: "DUPLICATE_IMPORT", videoId: existing.id },
        { status: 409 }
      );
    }

    // Create video record
    const videoTitle = title ? cleanTitle(title) : `YouTube Video (${videoId})`;
    const video = await db.video.create({
      data: {
        userId: dbUser.id,
        title: videoTitle,
        fileName: `${videoId}.mp4`,
        fileSize: 0,
        mimeType: "video/mp4",
        storageKey: `youtube:${videoId}`,
        storageUrl: `https://www.youtube.com/watch?v=${videoId}`,
        status: "PROCESSING",
        metadata: { source: "youtube", youtubeId: videoId, originalUrl: url },
      },
    });

    // Record usage (non-blocking)
    recordUsage(dbUser.id, "VIDEO_UPLOAD", { videoId: video.id, source: "youtube" }).catch(() => {});

    // Create transcription job
    const job = await createProcessingJob({
      videoId: video.id,
      userId: dbUser.id,
      type: "TRANSCRIPTION",
      options: { source: "youtube", youtubeId: videoId },
    });

    // Send to queue (non-blocking)
    sendJob({
      jobId: job.id,
      type: "TRANSCRIPTION",
      videoId: video.id,
      userId: dbUser.id,
      options: { source: "youtube", youtubeId: videoId },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      videoId: video.id,
      jobId: job.id,
      youtubeId: videoId,
      title: videoTitle,
      status: "processing",
    });
  } catch (error) {
    console.error("[IMPORT_YOUTUBE]", error);
    return NextResponse.json(
      { error: "Failed to import YouTube video. Please try again.", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
