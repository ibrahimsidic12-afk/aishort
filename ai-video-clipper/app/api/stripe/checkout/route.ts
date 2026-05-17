import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { createCheckoutSession } from "@/lib/stripe/checkout";

export async function POST(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { priceId, successUrl, cancelUrl } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: "Missing required field: priceId" },
        { status: 400 }
      );
    }

    // TODO: Validate priceId against known Stripe price IDs
    // TODO: Check if user already has an active subscription

    const session = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      priceId,
      successUrl: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      customerId: user.stripeCustomerId || undefined,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
