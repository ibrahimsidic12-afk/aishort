/**
 * Subscription management
 */

import { prisma } from "@/lib/db/prisma";
import { stripe } from "./stripe";
import { addCredits } from "./credits";
import { logger } from "@/lib/utils/logger";
import type { SubscriptionStatus } from "@/types";

/**
 * Sync subscription from Stripe webhook
 */
export async function syncSubscription(
  stripeSubscriptionId: string,
  customerId: string,
  status: string,
  priceId: string | null,
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!subscription) {
    logger.warn("No subscription found for customer", { customerId });
    return;
  }

  const mappedStatus = mapStripeStatus(status);

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      stripeSubscriptionId,
      stripePriceId: priceId,
      status: mappedStatus,
      currentPeriodStart,
      currentPeriodEnd,
    },
  });

  // Update user plan based on price
  const plan = priceId === process.env.STRIPE_BUSINESS_PRICE_ID ? "BUSINESS"
    : priceId === process.env.STRIPE_PRO_PRICE_ID ? "PRO"
    : "FREE";

  await prisma.user.update({
    where: { id: subscription.userId },
    data: { plan },
  });

  logger.info("Subscription synced", { userId: subscription.userId, status: mappedStatus, plan });
}

/**
 * Handle subscription created/renewed — grant credits
 */
export async function handleSubscriptionRenewal(userId: string, plan: string) {
  const creditAmounts: Record<string, number> = {
    PRO: 100,
    BUSINESS: 500,
  };

  const amount = creditAmounts[plan];
  if (amount) {
    await addCredits(userId, amount, `${plan} subscription renewal`);
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(userId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (!subscription?.stripeSubscriptionId) {
    throw new Error("No active subscription");
  }

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: true },
  });

  logger.info("Subscription cancelled", { userId });
}

/**
 * Resume a cancelled subscription
 */
export async function resumeSubscription(userId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (!subscription?.stripeSubscriptionId) {
    throw new Error("No subscription to resume");
  }

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  await prisma.subscription.update({
    where: { userId },
    data: { cancelAtPeriodEnd: false },
  });
}

function mapStripeStatus(status: string): SubscriptionStatus {
  switch (status) {
    case "active": return "ACTIVE";
    case "past_due": return "PAST_DUE";
    case "canceled": case "cancelled": return "CANCELLED";
    default: return "INACTIVE";
  }
}
