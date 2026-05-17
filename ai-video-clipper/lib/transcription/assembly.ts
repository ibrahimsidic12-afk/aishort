/**
 * AssemblyAI integration
 */

import type { TranscriptSegment } from "@/types";

const BASE_URL = "https://api.assemblyai.com/v2";

interface AssemblyOptions {
  languageCode?: string;
  speakerLabels?: boolean;
  autoHighlights?: boolean;
}

interface AssemblyResult {
  text: string;
  segments: TranscriptSegment[];
  language: string;
  duration: number;
}

/**
 * Submit audio for transcription
 */
export async function submitTranscription(
  audioUrl: string,
  options?: AssemblyOptions,
): Promise<string> {
  const response = await fetch(`${BASE_URL}/transcript`, {
    method: "POST",
    headers: {
      Authorization: process.env.ASSEMBLYAI_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      language_code: options?.languageCode ?? "en",
      speaker_labels: options?.speakerLabels ?? true,
      auto_highlights: options?.autoHighlights ?? true,
    }),
  });

  if (!response.ok) {
    throw new Error(`AssemblyAI submit error: ${response.status}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Poll for transcription result
 */
export async function pollTranscription(transcriptId: string): Promise<AssemblyResult> {
  const maxAttempts = 60;
  const pollInterval = 5000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${BASE_URL}/transcript/${transcriptId}`, {
      headers: { Authorization: process.env.ASSEMBLYAI_API_KEY! },
    });

    const data = await response.json();

    if (data.status === "completed") {
      const segments: TranscriptSegment[] = (data.utterances ?? []).map((u: any) => ({
        start: u.start / 1000, // ms to seconds
        end: u.end / 1000,
        text: u.text,
        speaker: u.speaker ? `Speaker ${u.speaker}` : undefined,
        confidence: u.confidence,
        words: u.words?.map((w: any) => ({
          start: w.start / 1000,
          end: w.end / 1000,
          text: w.text,
          confidence: w.confidence,
          speaker: w.speaker ? `Speaker ${w.speaker}` : undefined,
        })),
      }));

      return {
        text: data.text ?? "",
        segments,
        language: data.language_code ?? "en",
        duration: (data.audio_duration ?? 0),
      };
    }

    if (data.status === "error") {
      throw new Error(`AssemblyAI transcription failed: ${data.error}`);
    }

    // Wait before polling again
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("AssemblyAI transcription timed out");
}

/**
 * Full transcription flow: submit + poll
 */
export async function transcribeWithAssembly(
  audioUrl: string,
  options?: AssemblyOptions,
): Promise<AssemblyResult> {
  const transcriptId = await submitTranscription(audioUrl, options);
  return pollTranscription(transcriptId);
}
