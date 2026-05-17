import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/clerk";
import { prisma } from "@/lib/db/prisma";
import { enqueueClipRendering } from "@/lib/queue/enqueue";
import { renderClipSchema } from "@/lib/validations/clip";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = renderClipSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { clipId, settings } = parsed.data;

    // Verify clip belongs to user
    const clip = await prisma.clip.findFirst({
      where: { id: clipId, userId: user.id },
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Update clip status
    await prisma.clip.update({
      where: { id: clipId },
      data: { status: "RENDERING", metadata: settings as any },
    });

    // Enqueue rendering job
    const job = await enqueueClipRendering(clipId, user.id, settings as any);

    return NextResponse.json({
      jobId: job.id,
      clipId,
      status: "rendering",
    });
  } catch (error) {
    console.error("[CLIPS_RENDER]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
