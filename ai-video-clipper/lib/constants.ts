/**
 * Application constants
 */

export const PLAN_LIMITS = {
  FREE: {
    videosPerMonth: 5,
    clipsPerVideo: 3,
    maxVideoLength: 1800, // 30 min
    maxStorageGb: 1,
    maxFileSize: 500_000_000, // 500MB
    platforms: ["youtube"],
    priority: "low" as const,
  },
  PRO: {
    videosPerMonth: 50,
    clipsPerVideo: 10,
    maxVideoLength: 7200, // 2 hours
    maxStorageGb: 50,
    maxFileSize: 2_000_000_000, // 2GB
    platforms: ["youtube", "tiktok"],
    priority: "normal" as const,
  },
  BUSINESS: {
    videosPerMonth: Infinity,
    clipsPerVideo: 25,
    maxVideoLength: 14400, // 4 hours
    maxStorageGb: 500,
    maxFileSize: 5_000_000_000, // 5GB
    platforms: ["youtube", "tiktok", "instagram"],
    priority: "high" as const,
  },
} as const;

export const SUPPORTED_VIDEO_FORMATS = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
] as const;

export const SUPPORTED_AUDIO_FORMATS = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/flac",
] as const;

export const CLIP_DURATION = {
  MIN: 15, // seconds
  MAX: 180, // 3 minutes
  DEFAULT_MIN: 30,
  DEFAULT_MAX: 60,
} as const;

export const QUEUE_NAMES = {
  TRANSCRIPTION: "transcription",
  CLIP_GENERATION: "clip-generation",
  RENDERING: "rendering",
  THUMBNAILS: "thumbnails",
  PUBLISHING: "publishing",
  CLEANUP: "cleanup",
} as const;

export const AI_DEFAULTS = {
  MODEL: "gpt-4o",
  EMBEDDING_MODEL: "text-embedding-3-small",
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.7,
} as const;

export const RATE_LIMITS = {
  UPLOAD: { requests: 10, window: 60 }, // 10 uploads per minute
  API: { requests: 100, window: 60 }, // 100 API calls per minute
  GENERATE: { requests: 5, window: 60 }, // 5 generations per minute
  PUBLISH: { requests: 10, window: 300 }, // 10 publishes per 5 minutes
} as const;

export const SIGNED_URL_EXPIRY = {
  UPLOAD: 3600, // 1 hour
  DOWNLOAD: 86400, // 24 hours
  THUMBNAIL: 604800, // 7 days
} as const;
