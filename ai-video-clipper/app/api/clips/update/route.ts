import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

const UpdateClipSchema = z.object({
  clipId: z.string().min(1, "clipId is required"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be 100 characters or less")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  tags: z
    .array(z.string().max(30))
    .max(10, "Maximum 10 tags allowed")
    .optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const parseResult = UpdateClipSchema.safeParse(body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json(
        { error: `Validation failed: ${issues}` },
        { status: 400 }
      );
    }

    const { clipId, title, description, tags } = parseResult.data;

    // Verify clip belongs to user
    const clip = await db.clip.findFirst({
      where: { id: clipId, userId: user.id },
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    // Build update data (only include provided fields)
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update clip
    const updatedClip = await db.clip.update({
      where: { id: clipId },
      data: updateData as any,
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      clip: updatedClip,
    });
  } catch (error) {
    console.error("[CLIPS_UPDATE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
