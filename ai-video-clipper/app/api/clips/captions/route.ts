import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
// IMPORTANT: import from `lib/clips/generator`, not `lib/clips/captions`.
// `lib/clips/captions.ts` was an early stub that returned empty arrays for
// every clip; the real transcript-slicing implementation lives next to
// `generateClips` in the generator module. The two files share the same
// function names, so the wrong import compiled fine and silently broke
// every captions request.
import { getCaptions, updateCaptions } from "@/lib/clips/generator";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
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

    const captions = await getCaptions({ clipId });

    return NextResponse.json({
      clipId,
      captions: captions.segments,
      format: captions.format,
      language: captions.language,
    });
  } catch (error) {
    console.error("[CLIPS_CAPTIONS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // TODO: Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { clipId, captions, style } = body;

    if (!clipId || !captions) {
      return NextResponse.json(
        { error: "Missing required fields: clipId, captions" },
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

    // TODO: Validate caption segments format
    const updated = await updateCaptions({
      clipId,
      captions: { segments: captions, style: style || {} },
    });

    return NextResponse.json({
      clipId,
      captions: updated.segments,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("[CLIPS_CAPTIONS_PUT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
