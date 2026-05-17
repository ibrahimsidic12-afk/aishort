import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { deleteClipAssets } from "@/lib/clips/storage";
import { db } from "@/lib/db";

export async function DELETE(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const clipId = searchParams.get("clipId");

    if (!clipId) {
      return NextResponse.json(
        { error: "Missing required query parameter: clipId" },
        { status: 400 }
      );
    }

    // TODO: Verify clip belongs to user
    const clip = await db.clip.findFirst({
      where: { id: clipId, userId: user.id },
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // TODO: Delete clip assets from storage (video file, thumbnail, captions)
    await deleteClipAssets(clip.storageKey);

    // TODO: Delete clip record from database
    await db.clip.delete({ where: { id: clipId } });

    return NextResponse.json({
      success: true,
      deletedClipId: clipId,
    });
  } catch (error) {
    console.error("[CLIPS_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
