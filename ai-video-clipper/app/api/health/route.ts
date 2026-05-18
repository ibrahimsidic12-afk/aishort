import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const start = Date.now();
  
  try {
    // Quick health check without DB dependency
    const services = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "0.1.0",
      environment: process.env.NODE_ENV,
    };

    return NextResponse.json(services);
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
