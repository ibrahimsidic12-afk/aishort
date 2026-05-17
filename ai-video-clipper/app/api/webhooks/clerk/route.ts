import { NextRequest, NextResponse } from "next/server";

import { verifyClerkWebhook } from "@/lib/clerk/webhook";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // TODO: Verify Clerk webhook signature (Svix)
    const body = await req.text();
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: "Missing Svix verification headers" },
        { status: 400 }
      );
    }

    const event = await verifyClerkWebhook(body, {
      svixId,
      svixTimestamp,
      svixSignature,
    });

    if (!event) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    // TODO: Handle different Clerk event types
    switch (event.type) {
      case "user.created": {
        // TODO: Create user record in database
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventData = event.data as any;
        const { id, email_addresses, first_name, last_name, image_url } =
          eventData;

        await db.user.create({
          data: {
            clerkId: id,
            email: email_addresses[0]?.email_address,
            name: `${first_name || ""} ${last_name || ""}`.trim(),
            avatarUrl: image_url,
            plan: "FREE",
          },
        });
        break;
      }

      case "user.updated": {
        // TODO: Sync user profile changes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventData = event.data as any;
        const { id, email_addresses, first_name, last_name, image_url } =
          eventData;

        await db.user.update({
          where: { clerkId: id },
          data: {
            email: email_addresses[0]?.email_address,
            name: `${first_name || ""} ${last_name || ""}`.trim(),
            avatarUrl: image_url,
          },
        });
        break;
      }

      case "user.deleted": {
        // TODO: Handle user deletion (hard delete or soft delete via user-level flag)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { id } = (event as any).data;
        const exists = await db.user.findFirst({ where: { clerkId: id } });
        if (exists) {
          await db.user.delete({ where: { clerkId: id } });
        }
        break;
      }

      default:
        // TODO: Log unhandled event types for monitoring
        console.warn(`[WEBHOOKS_CLERK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOKS_CLERK]", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
