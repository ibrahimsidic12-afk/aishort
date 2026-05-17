/**
 * Billing validation schemas (Zod)
 */

import { z } from "zod";

export const createCheckoutSchema = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const purchaseCreditsSchema = z.object({
  amount: z.number().int().min(1).max(1000),
  paymentMethodId: z.string().min(1).optional(),
});

export const updateSubscriptionSchema = z.object({
  action: z.enum(["cancel", "resume", "upgrade", "downgrade"]),
  newPriceId: z.string().optional(),
});

export const stripeWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type PurchaseCreditsInput = z.infer<typeof purchaseCreditsSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
