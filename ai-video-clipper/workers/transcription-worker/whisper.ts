/**
 * Whisper transcription
 */

interface TranscriptionResult {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
  language: string;
}

export async function transcribeWithWhisper(
  audioUrl: string,
  language?: string,
): Promise<TranscriptionResult> {
  // TODO: Send audio to OpenAI Whisper API
  // TODO: Handle chunking for long audio files

  console.log(`[Whisper] Transcribing: ${audioUrl}`);

  return {
    text: "",
    segments: [],
    language: language ?? "en",
  };
}
