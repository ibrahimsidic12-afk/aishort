export type TranscriptProvider = "WHISPER" | "DEEPGRAM" | "ASSEMBLYAI";

export interface Transcript {
  id: string;
  videoId: string;
  content: string;
  segments: TranscriptSegment[];
  language: string | null;
  provider: TranscriptProvider;
  createdAt: Date;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  confidence?: number;
  words?: TranscriptWord[];
}

export interface TranscriptWord {
  start: number;
  end: number;
  text: string;
  confidence: number;
  speaker?: string;
}

export interface DiarizationResult {
  speakers: Speaker[];
  segments: DiarizedSegment[];
}

export interface Speaker {
  id: string;
  label: string;
  totalDuration: number;
}

export interface DiarizedSegment {
  start: number;
  end: number;
  speaker: string;
  text: string;
}
