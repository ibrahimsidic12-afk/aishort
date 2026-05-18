import { Webhook } from "svix";

export type ClerkEvent = {
  type: string;
  data: Record<string, unknown>;
};

/**
 * Verify and parse a Clerk webhook using Svix
 */
export async function verifyClerkWebhook(
  body: string,
  opts: { svixId: string; svixTimestamp: string; svixSignature: string }
): Promise<ClerkEvent | null> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[CLERK_WEBHOOK] CLERK_WEBHOOK_SECRET not set");
    return null;
  }

  try {
    const wh = new Webhook(secret);
    const event = wh.verify(body, {
      "svix-id": opts.svixId,
      "svix-timestamp": opts.svixTimestamp,
      "svix-signature": opts.svixSignature,
    }) as ClerkEvent;

    return event;
  } catch (error) {
    console.error("[CLERK_WEBHOOK] Verification failed:", error);
    return null;
  }
}
