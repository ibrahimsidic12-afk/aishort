import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/clerk";
import { createCheckoutSession } from "@/lib/billing/stripe";
import { createCheckoutSchema } from "@/lib/validations/billing";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createCheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { priceId, successUrl, cancelUrl } = parsed.data;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const url = await createCheckoutSession(
      user.id,
      priceId,
      successUrl || `${appUrl}/billing?success=true`,
      cancelUrl || `${appUrl}/pricing`,
    );

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
