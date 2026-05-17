/**
 * Stripe event processing bridge
 */

import {
  syncSubscription,
  handleSubscriptionRenewal,
} from "@/lib/billing/subscriptions";
import { addCredits } from "@/lib/billing/credits";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import type Stripe from "stripe";

/**
 * Handle a verified Stripe event
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case "invoice.paid":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;

    default:
      logger.info("Unhandled Stripe event type", { type: event.type });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const customerId = session.customer as string;

  if (!userId || !customerId) {
    logger.warn("Checkout session missing userId or customerId", { sessionId: session.id });
    return;
  }

  // Link Stripe customer to user
  await prisma.subscription.upsert({
    where: { userId },
    update: { stripeCustomerId: customerId },
    create: {
      userId,
      stripeCustomerId: customerId,
      status: "ACTIVE",
    },
  });

  // If this is a credit purchase (one-time), add credits
  if (session.mode === "payment") {
    const credits = parseInt(session.metadata?.credits ?? "0", 10);
    if (credits > 0) {
      await addCredits(userId, credits, "Credit purchase");
    }
  }

  logger.info("Checkout completed", { userId, customerId, mode: session.mode });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id ?? null;

  await syncSubscription(
    subscription.id,
    customerId,
    subscription.status,
    priceId,
    new Date(subscription.current_period_start * 1000),
    new Date(subscription.current_period_end * 1000),
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  await syncSubscription(
    subscription.id,
    customerId,
    "canceled",
    null,
    new Date(subscription.current_period_start * 1000),
    new Date(subscription.current_period_end * 1000),
  );
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  if (!customerId) return;

  // Find the user with this Stripe customer
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  });

  if (!subscription) {
    logger.warn("No subscription found for invoice", { customerId });
    return;
  }

  // Determine plan from price
  const priceId = invoice.lines.data[0]?.price?.id;
  const plan = priceId === process.env.STRIPE_BUSINESS_PRICE_ID
    ? "BUSINESS"
    : priceId === process.env.STRIPE_PRO_PRICE_ID
    ? "PRO"
    : "FREE";

  // Grant renewal credits
  await handleSubscriptionRenewal(subscription.userId, plan);

  logger.info("Invoice paid, credits granted", {
    userId: subscription.userId,
    plan,
  });
}
