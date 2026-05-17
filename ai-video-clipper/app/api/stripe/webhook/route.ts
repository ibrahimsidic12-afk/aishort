import { NextRequest, NextResponse } from "next/server";

import { verifyStripeWebhook } from "@/lib/stripe/webhook";
import { handleStripeEvent } from "@/lib/stripe/events";

export async function POST(req: NextRequest) {
  try {
    // TODO: Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // TODO: Verify webhook signature using Stripe secret
    const event = await verifyStripeWebhook(body, signature);

    if (!event) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // TODO: Handle different event types
    // - checkout.session.completed
    // - customer.subscription.updated
    // - customer.subscription.deleted
    // - invoice.payment_succeeded
    // - invoice.payment_failed
    await handleStripeEvent(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE_WEBHOOK]", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
