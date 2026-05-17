import { NextRequest, NextResponse } from "next/server";

import { verifyQStashSignature } from "@/lib/qstash/verify";
import { handleJobCallback } from "@/lib/jobs/callbacks";

export async function POST(req: NextRequest) {
  try {
    // TODO: Verify QStash signature for authenticity
    const body = await req.text();
    const signature = req.headers.get("upstash-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing upstash-signature header" },
        { status: 401 }
      );
    }

    const isValid = await verifyQStashSignature(body, signature || "");
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid QStash signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);
    const { jobId, type, status, result, error: jobError } = payload;

    // TODO: Route to appropriate handler based on job type
    await handleJobCallback({
      jobId,
      type,
      status,
      result,
      error: jobError,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOKS_QSTASH]", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
