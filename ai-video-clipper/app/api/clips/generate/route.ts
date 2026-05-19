import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { generateClips } from "@/lib/clips/generator";
import { db } from "@/lib/db";
import { checkQuota, recordUsage } from "@/lib/quota";

export const maxDuration = 300; // 5 minutes for transcription + generation

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { videoId, options } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: "Missing required field: videoId" },
        { status: 400 }
      );
    }

    // Verify video belongs to user
    const video = await db.video.findFirst({
      where: { id: videoId, userId: user.id },
      include: { transcript: { select: { id: true, content: true } } },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Mark video as READY if it was stuck
    if (video.status !== "READY") {
      await db.video.update({ where: { id: videoId }, data: { status: "READY" } });
    }

    // Transcribe with Deepgram if no transcript exists yet
    if (!video.transcript?.content && video.storageUrl) {
      console.log("[GENERATE] No transcript, transcribing with Deepgram...");
      try {
        await transcribeWithDeepgram(videoId, video.storageUrl);
      } catch (transcribeError) {
        console.warn("[GENERATE] Transcription failed, continuing with fallback clips:", transcribeError);
      }
    }

    // Check user's clip generation quota
    const quotaCheck = await checkQuota(user.id, "CLIP_GENERATION");
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        { error: quotaCheck.reason, remaining: quotaCheck.remaining, limit: quotaCheck.limit },
        { status: 429 }
      );
    }

    const job = await generateClips({
      videoId,
      userId: user.id,
      options: {
        maxClips: options?.maxClips || 10,
        minDuration: options?.minDuration || 15,
        maxDuration: options?.maxDuration || 60,
        style: options?.style || "engaging",
        aspectRatio: options?.aspectRatio || "9:16",
        ...options,
      },
    });

    // Record usage
    await recordUsage(user.id, "CLIP_GENERATION", { videoId, clipCount: job.clipIds.length });

    return NextResponse.json({
      jobId: job.id,
      status: "completed",
      clipCount: job.clipIds.length,
      videoId,
    });
  } catch (error) {
    console.error("[CLIPS_GENERATE]", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * Transcribe video audio using Deepgram REST API
 */
async function transcribeWithDeepgram(videoId: string, audioUrl: string): Promise<void> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY not configured");
  }

  // Skip YouTube URLs - Deepgram needs direct audio files
  if (audioUrl.includes("youtube.com") || audioUrl.includes("youtu.be")) {
    console.log("[GENERATE] YouTube URL detected, skipping Deepgram (needs direct audio file)");
    return;
  }

  const response = await fetch(
    "https://api.deepgram.com/v1/listen?punctuate=true&smart_format=true&language=en&model=nova-2",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: audioUrl }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Deepgram API error ${response.status}: ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const alternatives = data?.results?.channels?.[0]?.alternatives?.[0];

  if (!alternatives) {
    throw new Error("No transcription results from Deepgram");
  }

  const fullText = alternatives.transcript || "";
  const words = alternatives.words || [];
  const duration = data?.metadata?.duration || 0;

  // Build segments by grouping words into ~10-word or sentence-bounded chunks
  const segments: Array<{ start: number; end: number; text: string; confidence: number }> = [];
  let cur = { start: 0, end: 0, text: "", confidence: 0, count: 0 };

  for (const w of words) {
    if (cur.count === 0) cur.start = w.start;
    cur.end = w.end;
    cur.text += (cur.text ? " " : "") + (w.punctuated_word || w.word);
    cur.confidence += w.confidence || 0.9;
    cur.count++;

    const endsWithPunct = /[.!?]$/.test(cur.text);
    if (cur.count >= 10 || endsWithPunct) {
      segments.push({
        start: cur.start,
        end: cur.end,
        text: cur.text.trim(),
        confidence: cur.confidence / cur.count,
      });
      cur = { start: 0, end: 0, text: "", confidence: 0, count: 0 };
    }
  }
  if (cur.count > 0) {
    segments.push({
      start: cur.start,
      end: cur.end,
      text: cur.text.trim(),
      confidence: cur.confidence / cur.count,
    });
  }

  // Save transcript
  await db.transcript.upsert({
    where: { videoId },
    create: {
      videoId,
      content: fullText,
      segments: segments as any,
      language: "en",
      provider: "DEEPGRAM",
    },
    update: {
      content: fullText,
      segments: segments as any,
      language: "en",
    },
  });

  // Update video duration
  if (duration > 0) {
    await db.video.update({
      where: { id: videoId },
      data: { duration },
    });
  }

  console.log(`[GENERATE] Transcribed ${segments.length} segments, ${Math.round(duration)}s`);
}
