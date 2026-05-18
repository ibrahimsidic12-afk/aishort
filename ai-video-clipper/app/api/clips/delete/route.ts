import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { deleteClipAssets } from "@/lib/clips/generator";
import { db } from "@/lib/db";

export async function DELETE(req: NextRequest) {
  try {
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

    // Verify clip belongs to user
    const clip = await db.clip.findFirst({
      where: { id: clipId, userId: user.id },
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Delete clip assets from storage
    await deleteClipAssets({ storageKey: clip.storageKey });

    // Delete clip record from database
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
