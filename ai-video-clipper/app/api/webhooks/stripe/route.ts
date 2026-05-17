import { NextRequest, NextResponse } from "next/server";

import { verifyStripeWebhook } from "@/lib/stripe/webhook";
import { handleStripeEvent } from "@/lib/stripe/events";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // TODO: Get raw body for Stripe signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // TODO: Verify webhook signature using endpoint-specific secret
    const event = await verifyStripeWebhook(body, signature);

    if (!event) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // TODO: Idempotency check - skip if event already processed
    const existingEvent = await (db as any).webhookEvent.findUnique({
      where: { stripeEventId: (event as any).id },
    });

    if (existingEvent) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // TODO: Handle Stripe events
    // - checkout.session.completed → provision subscription
    // - customer.subscription.updated → update plan
    // - customer.subscription.deleted → downgrade to free
    // - invoice.payment_succeeded → record payment
    // - invoice.payment_failed → notify user, pause features
    await handleStripeEvent(event);

    // TODO: Record event as processed for idempotency
    await (db as any).webhookEvent.create({
      data: {
        stripeEventId: (event as any).id,
        type: (event as any).type,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOKS_STRIPE]", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
