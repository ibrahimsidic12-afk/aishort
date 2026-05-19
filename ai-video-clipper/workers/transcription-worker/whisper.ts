/**
 * Transcription using Deepgram SDK
 * Handles audio extraction, transcription, and speaker diarization
 */

import { prisma } from "@/lib/db/prisma";
import { createClient, type DeepgramClient } from "@deepgram/sdk";

/**
 * Lazy-initialized Deepgram client.
 *
 * Top-level `createClient(process.env.DEEPGRAM_API_KEY!)` made the module
 * crash at import time when the env var was absent (the `!` lies). That
 * cascaded into Next.js build failures and dev-mode crashes whenever this
 * file was reached transitively. Lazy init lets the module load anywhere
 * and only fails at the point where transcription is actually attempted,
 * with a clean error message.
 */
let _deepgram: DeepgramClient | null = null;

function getDeepgram(): DeepgramClient {
  if (_deepgram) return _deepgram;
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error(
      "DEEPGRAM_API_KEY is not configured. Set it in the deployment environment to enable transcription."
    );
  }
  _deepgram = createClient(apiKey);
  return _deepgram;
}

interface TranscriptionResult {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
    speaker?: number;
    words?: Array<{ word: string; start: number; end: number }>;
  }>;
  language: string;
  duration: number;
}

/**
 * Transcribe audio file using Deepgram
 */
export async function transcribeWithWhisper(
  audioUrl: string,
  language?: string,
  options?: {
    punctuate?: boolean;
    diarize?: boolean;
    smartFormat?: boolean;
  }
): Promise<TranscriptionResult> {
  console.log(`[Whisper/Deepgram] Transcribing: ${audioUrl}`);

  try {
    const response = await getDeepgram().transcription.complete({
      url: audioUrl,
      language: language || "en",
      punctuate: options?.punctuate ?? true,
      smart_format: options?.smartFormat ?? true,
      diarize: options?.diarize ?? false,
    });

    const segments: TranscriptionResult["segments"] = [];
    let text = "";

    if (response.paragraphs?.paragraphs) {
      for (const para of response.paragraphs.paragraphs) {
        const paraText = para.sentences?.map((s: any) => s.text).join("") || "";
        text += paraText + " ";

        if (para.sentences) {
          for (const sentence of para.sentences) {
            segments.push({
              start: sentence.start,
              end: sentence.end,
              text: sentence.text,
              confidence: sentence.confidence || 0.9,
              speaker: para.speaker,
            });
          }
        }
      }
    }

    const result: TranscriptionResult = {
      text: text.trim(),
      segments,
      language: language || "en",
      duration: response.metadata?.duration || 0,
    };

    console.log(`[Whisper/Deepgram] Completed: ${segments.length} segments`);
    return result;

  } catch (error) {
    console.error("[Whisper/Deepgram] Error:", error);
    throw error;
  }
}

/**
 * Transcribe and save transcript to database
 */
export async function transcribeAndSave(videoId: string): Promise<string> {
  console.log(`[Whisper/Deepgram] Transcribing video: ${videoId}`);

  const video = await prisma.video.findUnique({
    where: { id: videoId },
  });

  if (!video) {
    throw new Error(`Video not found: ${videoId}`);
  }

  const audioUrl = video.storageUrl;
  if (!audioUrl) {
    throw new Error(`Video has no storage URL: ${videoId}`);
  }

  // Mark transcribing BEFORE the (slow) Deepgram call, so the UI shows
  // the right status while the request is in flight.
  await prisma.video.update({
    where: { id: videoId },
    data: { status: "TRANSCRIBING" },
  });

  const result = await transcribeWithWhisper(audioUrl);

  const transcript = await prisma.transcript.upsert({
    where: { videoId },
    create: {
      videoId,
      content: result.text,
      segments: result.segments as any,
      language: result.language,
      provider: "DEEPGRAM",
    },
    update: {
      content: result.text,
      segments: result.segments as any,
      language: result.language,
    },
  });

  // Now that the transcript row exists, flip the video to READY and
  // record the duration we got back from Deepgram. Previously this set
  // status to TRANSCRIBING — backwards: the transcript was already saved,
  // and the UI was left thinking work was still in flight forever.
  await prisma.video.update({
    where: { id: videoId },
    data: {
      status: "READY",
      duration: result.duration || video.duration,
    },
  });

  console.log(`[Whisper/Deepgram] Saved transcript: ${transcript.id}`);
  return transcript.id;
}

export function chunkAudioForLongFiles(
  duration: number,
  maxChunkDuration: number = 600
): Array<{ start: number; end: number }> {
  const chunks: Array<{ start: number; end: number }> = [];
  let currentStart = 0;

  while (currentStart < duration) {
    const end = Math.min(currentStart + maxChunkDuration, duration);
    chunks.push({ start: currentStart, end });
    currentStart = end;
  }

  return chunks;
}
