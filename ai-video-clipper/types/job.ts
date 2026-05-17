export type JobType =
  | "TRANSCRIPTION"
  | "CLIP_GENERATION"
  | "CLIP_RENDERING"
  | "THUMBNAIL_GENERATION"
  | "PUBLISH"
  | "CLEANUP";

export type JobStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface Job {
  id: string;
  userId: string;
  videoId: string | null;
  type: JobType;
  status: JobStatus;
  progress: number;
  result: JobResult | null;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobResult {
  clipIds?: string[];
  transcriptId?: string;
  thumbnailUrls?: string[];
  publishedUrls?: string[];
  [key: string]: unknown;
}

export interface JobCreateRequest {
  type: JobType;
  videoId?: string;
  clipId?: string;
  payload?: Record<string, unknown>;
}

export interface JobStatusResponse {
  id: string;
  status: JobStatus;
  progress: number;
  error: string | null;
  result: JobResult | null;
}
