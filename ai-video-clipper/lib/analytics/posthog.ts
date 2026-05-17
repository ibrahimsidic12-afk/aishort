/**
 * PostHog server-side client
 */

import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

function getPostHog(): PostHog {
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      flushAt: 10,
      flushInterval: 5000,
    });
  }
  return posthogClient;
}

/**
 * Capture a server-side event
 */
export function capture(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
) {
  const ph = getPostHog();
  ph.capture({
    distinctId,
    event,
    properties,
  });
}

/**
 * Identify a user with properties
 */
export function identify(
  distinctId: string,
  properties?: Record<string, unknown>,
) {
  const ph = getPostHog();
  ph.identify({
    distinctId,
    properties,
  });
}

/**
 * Set user properties (alias for group-level data)
 */
export function setUserProperties(
  distinctId: string,
  properties: Record<string, unknown>,
) {
  const ph = getPostHog();
  ph.identify({
    distinctId,
    properties: { $set: properties },
  });
}

/**
 * Flush pending events (call on server shutdown)
 */
export async function flush() {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}
