/**
 * Clip asset storage management bridge
 */

import { deleteFromR2, getClipKey, getThumbnailKey } from "@/lib/storage/r2";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

/**
 * Delete all storage assets associated with a clip (video file and thumbnail)
 */
export async function deleteClipAssets(clipId: string): Promise<void> {
  const clip = await prisma.clip.findUnique({
    where: { id: clipId },
    select: { id: true, userId: true, storageKey: true, thumbnailKey: true },
  });

  if (!clip) {
    throw new Error(`Clip not found: ${clipId}`);
  }

  const deletionPromises: Promise<unknown>[] = [];

  // Delete the clip video file from R2
  if (clip.storageKey) {
    deletionPromises.push(
      deleteFromR2(clip.storageKey).catch((err) => {
        logger.warn("Failed to delete clip file from R2", { clipId, key: clip.storageKey, error: err });
      }),
    );
  }

  // Delete the thumbnail from R2
  if (clip.thumbnailKey) {
    deletionPromises.push(
      deleteFromR2(clip.thumbnailKey).catch((err) => {
        logger.warn("Failed to delete thumbnail from R2", { clipId, key: clip.thumbnailKey, error: err });
      }),
    );
  }

  await Promise.all(deletionPromises);

  // Clear storage references in the database
  await prisma.clip.update({
    where: { id: clipId },
    data: {
      storageKey: null,
      thumbnailKey: null,
    },
  });

  logger.info("Clip assets deleted", { clipId });
}
