export type ClipStatus =
  | "PENDING"
  | "GENERATING"
  | "RENDERING"
  | "READY"
  | "PUBLISHED"
  | "ERROR";

export interface Clip {
  id: string;
  userId: string;
  videoId: string;
  title: string;
  description: string | null;
  startTime: number;
  endTime: number;
  duration: number;
  storageKey: string | null;
  storageUrl: string | null;
  thumbnailUrl: string | null;
  status: ClipStatus;
  score: number | null;
  viralityScore: number | null;
  tags: string[];
  captions: CaptionData | null;
  metadata: ClipMetadata | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaptionData {
  segments: CaptionSegment[];
  style: CaptionStyle;
}

export interface CaptionSegment {
  start: number;
  end: number;
  text: string;
  words?: CaptionWord[];
}

export interface CaptionWord {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  position: "top" | "center" | "bottom";
  animation: "none" | "fade" | "pop" | "highlight";
}

export interface ClipMetadata {
  width?: number;
  height?: number;
  aspectRatio?: string;
  renderSettings?: RenderSettings;
}

export interface RenderSettings {
  resolution: "720p" | "1080p" | "4k";
  format: "mp4" | "webm";
  quality: number;
  includeCaptions: boolean;
}

export interface ClipGenerationRequest {
  videoId: string;
  preferences?: ClipPreferences;
}

export interface ClipPreferences {
  minDuration: number;
  maxDuration: number;
  maxClips: number;
  style: "viral" | "educational" | "entertainment" | "auto";
  platforms: ("youtube" | "tiktok" | "instagram")[];
}
