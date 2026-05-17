/**
 * YouTube video upload (resumable)
 */

import { getAccessToken } from "./client";

const UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";

interface UploadMetadata {
  title: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: "public" | "private" | "unlisted";
  madeForKids?: boolean;
}

/**
 * Initialize a resumable upload session
 */
export async function initiateUpload(
  userId: string,
  metadata: UploadMetadata,
  fileSize: number,
): Promise<string> {
  const token = await getAccessToken(userId);

  const body = {
    snippet: {
      title: metadata.title,
      description: metadata.description ?? "",
      tags: metadata.tags ?? [],
      categoryId: metadata.categoryId ?? "22", // People & Blogs
    },
    status: {
      privacyStatus: metadata.privacyStatus ?? "private",
      selfDeclaredMadeForKids: metadata.madeForKids ?? false,
    },
  };

  const params = new URLSearchParams({
    uploadType: "resumable",
    part: "snippet,status",
  });

  const response = await fetch(`${UPLOAD_URL}?${params}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(fileSize),
      "X-Upload-Content-Type": "video/mp4",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube upload init failed: ${error}`);
  }

  const uploadUrl = response.headers.get("Location");
  if (!uploadUrl) throw new Error("No upload URL returned");

  return uploadUrl;
}

/**
 * Upload video data to the resumable upload URL
 */
export async function uploadVideoData(
  uploadUrl: string,
  videoBuffer: Buffer,
): Promise<string> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(videoBuffer.length),
    },
    body: videoBuffer,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube upload failed: ${error}`);
  }

  const data = await response.json();
  return data.id; // YouTube video ID
}

/**
 * Full upload flow: init + upload
 */
export async function uploadToYouTube(
  userId: string,
  videoBuffer: Buffer,
  metadata: UploadMetadata,
): Promise<string> {
  const uploadUrl = await initiateUpload(userId, metadata, videoBuffer.length);
  const videoId = await uploadVideoData(uploadUrl, videoBuffer);
  return videoId;
}
