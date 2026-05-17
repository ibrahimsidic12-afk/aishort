import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/clerk";
import { createPresignedUploadUrl } from "@/lib/storage/upload";
import { getVideoKey } from "@/lib/storage/r2";
import { SUPPORTED_VIDEO_FORMATS, PLAN_LIMITS } from "@/lib/constants";
import { presignedUploadSchema } from "@/lib/validations/upload";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = presignedUploadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { fileName, fileType, fileSize } = parsed.data;

    // Check plan limits
    const limits = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];
    if (fileSize > limits.maxFileSize) {
      return NextResponse.json(
        { error: `File too large. Max ${limits.maxFileSize / 1_000_000}MB for ${user.plan} plan.` },
        { status: 400 },
      );
    }

    // Generate storage key and presigned URL
    const key = getVideoKey(user.id, fileName);
    const uploadUrl = await createPresignedUploadUrl(key, fileType);
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    return NextResponse.json({ uploadUrl, key, expiresAt });
  } catch (error) {
    console.error("[UPLOAD_PRESIGNED]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
