import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { getAnalytics } from "@/lib/analytics/queries";

export async function GET(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const period = searchParams.get("period") || "30d";
    const metric = searchParams.get("metric");

    // TODO: Validate period format (7d, 30d, 90d, 1y, custom)
    const validPeriods = ["7d", "30d", "90d", "1y"];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: `Invalid period. Must be one of: ${validPeriods.join(", ")}` },
        { status: 400 }
      );
    }

    // TODO: Fetch analytics data for user
    const analytics = await getAnalytics({
      userId: user.id,
      period,
      metric: metric || undefined,
    });

    return NextResponse.json({
      period,
      data: {
        totalVideos: analytics.totalVideos,
        totalClips: analytics.totalClips,
        totalPublished: analytics.totalPublished,
        totalViews: analytics.totalViews,
        clipsByDay: analytics.clipsByDay,
        topClips: analytics.topClips,
        platformBreakdown: analytics.platformBreakdown,
        processingMinutes: analytics.processingMinutes,
      },
    });
  } catch (error) {
    console.error("[ANALYTICS]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
