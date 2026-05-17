/**
 * Deepgram integration
 */

import type { TranscriptSegment, TranscriptWord } from "@/types";

interface DeepgramOptions {
  language?: string;
  model?: string;
  punctuate?: boolean;
  diarize?: boolean;
  smartFormat?: boolean;
}

interface DeepgramResult {
  text: string;
  segments: TranscriptSegment[];
  language: string;
  duration: number;
  speakers?: number;
}

/**
 * Transcribe audio with Deepgram Nova-2
 */
export async function transcribeWithDeepgram(
  audioUrl: string,
  options?: DeepgramOptions,
): Promise<DeepgramResult> {
  const {
    language = "en",
    model = "nova-2",
    punctuate = true,
    diarize = true,
    smartFormat = true,
  } = options ?? {};

  const params = new URLSearchParams({
    model,
    language,
    punctuate: String(punctuate),
    diarize: String(diarize),
    smart_format: String(smartFormat),
    utterances: "true",
    paragraphs: "true",
  });

  const response = await fetch(
    `https://api.deepgram.com/v1/listen?${params}`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: audioUrl }),
    },
  );

  if (!response.ok) {
    throw new Error(`Deepgram API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const channel = data.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];

  if (!alternative) {
    throw new Error("No transcription results from Deepgram");
  }

  // Convert Deepgram paragraphs/utterances to our segment format
  const segments: TranscriptSegment[] = (alternative.paragraphs?.paragraphs ?? []).flatMap(
    (para: any) =>
      para.sentences.map((sent: any) => ({
        start: sent.start,
        end: sent.end,
        text: sent.text,
        speaker: para.speaker !== undefined ? `Speaker ${para.speaker}` : undefined,
        words: alternative.words
          ?.filter((w: any) => w.start >= sent.start && w.end <= sent.end)
          .map((w: any) => ({
            start: w.start,
            end: w.end,
            text: w.punctuated_word || w.word,
            confidence: w.confidence,
            speaker: w.speaker !== undefined ? `Speaker ${w.speaker}` : undefined,
          })),
      })),
  );

  return {
    text: alternative.transcript,
    segments,
    language,
    duration: data.metadata?.duration ?? 0,
    speakers: data.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs
      ? new Set(
          data.results.channels[0].alternatives[0].paragraphs.paragraphs.map((p: any) => p.speaker),
        ).size
      : undefined,
  };
}
