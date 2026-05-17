import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // TODO: Check database connectivity
    const dbHealthy = await db.$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false);

    // TODO: Check external service connectivity (optional)
    const services = {
      database: dbHealthy,
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || "unknown",
      environment: process.env.NODE_ENV,
    };

    if (!dbHealthy) {
      return NextResponse.json(
        {
          status: "degraded",
          ...services,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: "healthy",
      ...services,
    });
  } catch (error) {
    console.error("[HEALTH]", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 503 }
    );
  }
}
