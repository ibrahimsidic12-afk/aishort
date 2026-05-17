import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { generatePresignedUrl } from "@/lib/storage/presigned";
import { validateFileType, validateFileSize } from "@/lib/upload/validation";

export async function POST(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, fileType, fileSize } = body;

    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileType, fileSize" },
        { status: 400 }
      );
    }

    // TODO: Validate file type (mp4, mov, avi, webm, etc.)
    if (!validateFileType(fileType)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    // TODO: Validate file size against user's plan limits
    if (!validateFileSize(fileSize, user.plan)) {
      return NextResponse.json(
        { error: "File size exceeds plan limit" },
        { status: 400 }
      );
    }

    // TODO: Check user's upload quota
    // TODO: Generate unique storage key
    const { url, key, expiresAt } = await generatePresignedUrl({
      userId: user.id,
      fileName,
      fileType,
      fileSize,
    });

    return NextResponse.json({
      uploadUrl: url,
      key,
      expiresAt,
    });
  } catch (error) {
    console.error("[UPLOAD_PRESIGNED]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
