/**
 * Event tracking helpers
 */

import { capture } from "./posthog";

// Typed event names
export const EVENTS = {
  VIDEO_UPLOADED: "video_uploaded",
  VIDEO_PROCESSED: "video_processed",
  TRANSCRIPTION_COMPLETE: "transcription_complete",
  CLIPS_GENERATED: "clips_generated",
  CLIP_RENDERED: "clip_rendered",
  CLIP_PUBLISHED: "clip_published",
  SUBSCRIPTION_CREATED: "subscription_created",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
  CREDITS_PURCHASED: "credits_purchased",
  PLATFORM_CONNECTED: "platform_connected",
} as const;

export function trackVideoUploaded(userId: string, props: { videoId: string; fileSize: number; duration?: number }) {
  capture(userId, EVENTS.VIDEO_UPLOADED, props);
}

export function trackClipsGenerated(userId: string, props: { videoId: string; clipCount: number; avgScore: number }) {
  capture(userId, EVENTS.CLIPS_GENERATED, props);
}

export function trackClipPublished(userId: string, props: { clipId: string; platform: string; viralityScore?: number }) {
  capture(userId, EVENTS.CLIP_PUBLISHED, props);
}

export function trackSubscriptionCreated(userId: string, props: { plan: string; priceId: string }) {
  capture(userId, EVENTS.SUBSCRIPTION_CREATED, props);
}

export function trackSubscriptionCancelled(userId: string, props: { plan: string; reason?: string }) {
  capture(userId, EVENTS.SUBSCRIPTION_CANCELLED, props);
}

export function trackPlatformConnected(userId: string, props: { platform: string }) {
  capture(userId, EVENTS.PLATFORM_CONNECTED, props);
}

export function trackTranscriptionComplete(userId: string, props: { videoId: string; provider: string; duration: number }) {
  capture(userId, EVENTS.TRANSCRIPTION_COMPLETE, props);
}

export function trackClipRendered(userId: string, props: { clipId: string; duration: number; resolution: string }) {
  capture(userId, EVENTS.CLIP_RENDERED, props);
}
