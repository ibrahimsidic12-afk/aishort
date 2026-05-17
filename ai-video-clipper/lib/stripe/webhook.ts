/**
 * Stripe webhook verification bridge
 */

import { validateStripeWebhook } from "@/lib/security/validate-webhook";
import type Stripe from "stripe";

/**
 * Verify a Stripe webhook payload and return the parsed event
 */
export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string,
): Stripe.Event {
  const event = validateStripeWebhook(payload, signature);
  return event;
}
