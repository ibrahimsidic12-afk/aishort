import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/clerk";
import { createPortalSession } from "@/lib/billing/stripe";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const url = await createPortalSession(
      user.id,
      `${appUrl}/billing`,
    );

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("[STRIPE_PORTAL]", error);

    if (error.message?.includes("No billing account")) {
      return NextResponse.json(
        { error: "No billing account found. Subscribe to a plan first." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
