/**
 * TikTok video upload
 */

import { tiktokRequest, getAccessToken } from "./client";
import { getFromR2 } from "@/lib/storage/r2";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

interface TikTokPublishOptions {
  title: string;
  privacyLevel?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
  disableComment?: boolean;
  disableDuet?: boolean;
  disableStitch?: boolean;
}

/**
 * Publish a clip to TikTok using direct post
 */
export async function publishToTikTok(
  userId: string,
  clipId: string,
  options: TikTokPublishOptions,
): Promise<{ publishId: string }> {
  const clip = await prisma.clip.findUnique({
    where: { id: clipId },
  });

  if (!clip || !clip.storageKey) {
    throw new Error("Clip not found or not rendered");
  }

  // Step 1: Initialize upload
  const initResponse = await tiktokRequest(userId, "/post/publish/video/init/", {
    method: "POST",
    body: JSON.stringify({
      post_info: {
        title: options.title,
        privacy_level: options.privacyLevel ?? "PUBLIC_TO_EVERYONE",
        disable_comment: options.disableComment ?? false,
        disable_duet: options.disableDuet ?? false,
        disable_stitch: options.disableStitch ?? false,
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: clip.metadata ? (clip.metadata as any).fileSize : 0,
      },
    }),
  });

  const initData = await initResponse.json();
  const uploadUrl = initData.data?.upload_url;
  const publishId = initData.data?.publish_id;

  if (!uploadUrl || !publishId) {
    throw new Error("Failed to initialize TikTok upload");
  }

  // Step 2: Upload the video file
  const r2Object = await getFromR2(clip.storageKey);
  const body = await r2Object.Body?.transformToByteArray();
  if (!body) throw new Error("Failed to download clip from storage");

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Range": `bytes 0-${body.length - 1}/${body.length}`,
    },
    body: Buffer.from(body),
  });

  if (!uploadResponse.ok) {
    throw new Error(`TikTok upload failed: ${uploadResponse.status}`);
  }

  logger.info("Published to TikTok", { clipId, publishId });

  return { publishId };
}

/**
 * Check the status of a TikTok publish
 */
export async function checkPublishStatus(
  userId: string,
  publishId: string,
): Promise<{ status: string; videoId?: string }> {
  const response = await tiktokRequest(
    userId,
    `/post/publish/status/fetch/?publish_id=${publishId}`,
  );

  const data = await response.json();
  return {
    status: data.data?.status ?? "unknown",
    videoId: data.data?.video_id,
  };
}
