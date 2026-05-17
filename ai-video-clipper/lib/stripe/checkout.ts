import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function createCheckoutSession(input: {
  userId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
}): Promise<Stripe.Checkout.Session> {
  console.warn("[STRIPE] createCheckoutSession: stub");
  return { id: "cs_stub", object: "checkout.session", mode: "subscription", payment_method_types: [], url: input.successUrl } as any;
}
