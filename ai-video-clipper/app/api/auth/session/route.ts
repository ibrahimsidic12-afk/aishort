import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  try {
    // TODO: Validate session token from cookies/headers
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    // TODO: Fetch user subscription status and connected accounts
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
        connectedAccounts: user.connectedAccounts,
      },
    });
  } catch (error) {
    console.error("[AUTH_SESSION]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
