export type VideoStatus =
  | "UPLOADING"
  | "PROCESSING"
  | "TRANSCRIBING"
  | "READY"
  | "ERROR";

export interface Video {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  fileName: string;
  fileSize: number;
  duration: number | null;
  mimeType: string;
  storageKey: string;
  storageUrl: string | null;
  status: VideoStatus;
  metadata: VideoMetadata | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoMetadata {
  width?: number;
  height?: number;
  fps?: number;
  bitrate?: number;
  codec?: string;
  audioCodec?: string;
}

export interface UploadPresignedResponse {
  uploadUrl: string;
  key: string;
  fields?: Record<string, string>;
}

export interface MultipartUploadInit {
  uploadId: string;
  key: string;
}

export interface MultipartUploadPart {
  partNumber: number;
  etag: string;
}
