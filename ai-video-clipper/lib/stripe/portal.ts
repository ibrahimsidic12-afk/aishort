import Stripe from "stripe";
import { stripe } from "./checkout";

export async function createBillingPortalSession(
  input: { customerId: string; returnUrl: string }
): Promise<Stripe.BillingPortal.Session> {
  console.warn("[STRIPE_PORTAL] stub");
  const session = await stripe.billingPortal.sessions.create({
    customer: input.customerId,
    return_url: input.returnUrl,
  });
  return session;
}
