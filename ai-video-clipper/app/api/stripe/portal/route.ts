import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { createBillingPortalSession } from "@/lib/stripe/portal";

export async function POST(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found. Please subscribe to a plan first." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { returnUrl } = body;

    // TODO: Create Stripe Billing Portal session
    const session = await createBillingPortalSession({
      customerId: user.stripeCustomerId,
      returnUrl: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("[STRIPE_PORTAL]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
