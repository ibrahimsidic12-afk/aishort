import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { generatePresignedUrl } from "@/lib/storage/presigned";
import { validateFileType, validateFileSize } from "@/lib/upload/validation";

export async function POST(req: NextRequest) {
  try {
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

    if (!validateFileType(fileType)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 400 }
      );
    }

    const maxSize = user.plan === "FREE" ? 2e9 : user.plan === "PRO" ? 10e9 : 50e9;
    if (!validateFileSize(fileSize, maxSize)) {
      return NextResponse.json(
        { error: "File size exceeds plan limit" },
        { status: 400 }
      );
    }

    const { uploadUrl, key } = await generatePresignedUrl({
      key: `${user.id}/${Date.now()}-${fileName}`,
    });

    return NextResponse.json({
      uploadUrl,
      key,
    });
  } catch (error) {
    console.error("Presigned URL generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
