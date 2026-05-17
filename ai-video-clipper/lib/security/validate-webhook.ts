/**
 * Webhook signature validation
 */

import { createHmac, timingSafeEqual } from "crypto";
import Stripe from "stripe";

/**
 * Validate Stripe webhook signature
 */
export function validateStripeWebhook(
  payload: string | Buffer,
  signature: string,
): Stripe.Event {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-04-10",
  });

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
}

/**
 * Validate Clerk webhook signature (Svix)
 */
export function validateClerkWebhook(
  payload: string,
  headers: {
    svixId: string;
    svixTimestamp: string;
    svixSignature: string;
  },
): boolean {
  const secret = process.env.CLERK_WEBHOOK_SECRET!;

  // Remove whsec_ prefix if present
  const secretBytes = Buffer.from(
    secret.startsWith("whsec_") ? secret.slice(6) : secret,
    "base64",
  );

  const toSign = `${headers.svixId}.${headers.svixTimestamp}.${payload}`;
  const expectedSignature = createHmac("sha256", secretBytes)
    .update(toSign)
    .digest("base64");

  // Check if any of the provided signatures match
  const signatures = headers.svixSignature.split(" ");
  for (const sig of signatures) {
    const sigValue = sig.split(",")[1];
    if (!sigValue) continue;

    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(sigValue);

    if (expected.length === received.length && timingSafeEqual(expected, received)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate generic HMAC webhook signature
 */
export function validateHMACSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm = "sha256",
): boolean {
  const expected = createHmac(algorithm, secret)
    .update(payload)
    .digest("hex");

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signature);

  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

/**
 * Validate QStash webhook signature
 */
export async function validateQStashSignature(
  body: string,
  signature: string,
): Promise<boolean> {
  // QStash uses its own verification through the @upstash/qstash Receiver
  // This is handled in lib/queue/workers.ts
  const { verifyQStashSignature } = await import("@/lib/queue/workers");
  return verifyQStashSignature(body, signature);
}
