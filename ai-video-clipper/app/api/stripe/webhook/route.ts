import { NextRequest, NextResponse } from "next/server";

import { stripe } from "@/lib/billing/stripe";
import { syncSubscription, handleSubscriptionRenewal } from "@/lib/billing/subscriptions";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 },
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error("STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 },
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logger.error("Stripe webhook signature verification failed", { error: String(err) });
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 },
      );
    }

    // Handle events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId && customerId) {
          // Create or update subscription record
          await prisma.subscription.upsert({
            where: { userId },
            update: {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              status: "ACTIVE",
            },
            create: {
              userId,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              status: "ACTIVE",
            },
          });

          logger.info("Checkout completed", { userId, customerId });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        await syncSubscription(
          subscription.id,
          customerId,
          subscription.status,
          subscription.items.data[0]?.price?.id ?? null,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        await syncSubscription(
          subscription.id,
          customerId,
          "canceled",
          null,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
        );
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;

        // Find user and grant credits on renewal
        const sub = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
          include: { user: true },
        });

        if (sub) {
          await handleSubscriptionRenewal(sub.userId, sub.user.plan);
          logger.info("Invoice paid, credits granted", { userId: sub.userId });
        }
        break;
      }

      default:
        logger.info(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE_WEBHOOK]", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
