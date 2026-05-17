/**
 * OpenAI Whisper integration
 */

import { openai } from "@/lib/ai/client";
import type { TranscriptSegment } from "@/types";

interface WhisperOptions {
  language?: string;
  prompt?: string;
  responseFormat?: "json" | "verbose_json" | "srt" | "vtt";
}

interface WhisperResult {
  text: string;
  segments: TranscriptSegment[];
  language: string;
  duration: number;
}

/**
 * Transcribe audio file with Whisper
 */
export async function transcribeWithWhisper(
  audioFile: File | Buffer,
  options?: WhisperOptions,
): Promise<WhisperResult> {
  const file = audioFile instanceof Buffer
    ? new File([audioFile], "audio.mp3", { type: "audio/mpeg" })
    : audioFile;

  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: options?.language,
    prompt: options?.prompt,
    response_format: "verbose_json",
    timestamp_granularities: ["word", "segment"],
  });

  const result = response as any;

  const segments: TranscriptSegment[] = (result.segments ?? []).map((seg: any) => ({
    start: seg.start,
    end: seg.end,
    text: seg.text.trim(),
    confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : undefined,
    words: seg.words?.map((w: any) => ({
      start: w.start,
      end: w.end,
      text: w.word,
      confidence: w.probability ?? 1,
    })),
  }));

  return {
    text: result.text,
    segments,
    language: result.language ?? options?.language ?? "en",
    duration: result.duration ?? 0,
  };
}

/**
 * Translate audio to English with Whisper
 */
export async function translateWithWhisper(audioFile: File | Buffer): Promise<WhisperResult> {
  const file = audioFile instanceof Buffer
    ? new File([audioFile], "audio.mp3", { type: "audio/mpeg" })
    : audioFile;

  const response = await openai.audio.translations.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
  });

  const result = response as any;

  return {
    text: result.text,
    segments: (result.segments ?? []).map((seg: any) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text.trim(),
    })),
    language: "en",
    duration: result.duration ?? 0,
  };
}
