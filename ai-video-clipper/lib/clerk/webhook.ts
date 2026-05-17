/**
 * Clerk webhook verification bridge
 */

import { validateClerkWebhook } from "@/lib/security/validate-webhook";

interface ClerkWebhookHeaders {
  "svix-id"?: string;
  "svix-timestamp"?: string;
  "svix-signature"?: string;
}

interface ClerkWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * Verify a Clerk webhook request and return the parsed event
 */
export function verifyClerkWebhook(
  body: string,
  headers: ClerkWebhookHeaders,
): ClerkWebhookEvent {
  const svixId = headers["svix-id"];
  const svixTimestamp = headers["svix-timestamp"];
  const svixSignature = headers["svix-signature"];

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error("Missing required Svix headers for Clerk webhook verification");
  }

  const isValid = validateClerkWebhook(body, {
    svixId,
    svixTimestamp,
    svixSignature,
  });

  if (!isValid) {
    throw new Error("Invalid Clerk webhook signature");
  }

  const event = JSON.parse(body) as ClerkWebhookEvent;
  return event;
}
