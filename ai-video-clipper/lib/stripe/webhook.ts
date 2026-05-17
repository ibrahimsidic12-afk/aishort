import Stripe from "stripe";

export async function verifyStripeWebhook(
  body: string,
  signature: string
): Promise<Stripe.Event | null> {
  console.warn("[STRIPE_WEBHOOK] verifyStripeWebhook: stub");
  return null;
}
