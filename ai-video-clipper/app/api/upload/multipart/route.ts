import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import {
  initiateMultipartUpload,
  generatePartPresignedUrl,
  completeMultipartUpload,
} from "@/lib/storage/multipart";

export async function POST(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, key, uploadId, partNumber, parts } = body;

    switch (action) {
      case "initiate": {
        // TODO: Validate file type and size limits
        if (!key) {
          return NextResponse.json(
            { error: "Missing required field: key" },
            { status: 400 }
          );
        }

        const result = await initiateMultipartUpload({ key });

        return NextResponse.json({
          uploadId: result.uploadId,
          key: result.key,
        });
      }

      case "presign-part": {
        // TODO: Validate part number range
        if (!key || !uploadId || !partNumber) {
          return NextResponse.json(
            { error: "Missing required fields: key, uploadId, partNumber" },
            { status: 400 }
          );
        }

        const url = await generatePartPresignedUrl({
          key,
          uploadId,
          partNumber,
        });

        return NextResponse.json({ url });
      }

      case "complete": {
        // TODO: Validate all parts are present
        if (!key || !uploadId || !parts) {
          return NextResponse.json(
            { error: "Missing required fields: key, uploadId, parts" },
            { status: 400 }
          );
        }

        await completeMultipartUpload({ key, uploadId, parts });

        return NextResponse.json({ success: true, key });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Must be: initiate, presign-part, complete" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[UPLOAD_MULTIPART]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
