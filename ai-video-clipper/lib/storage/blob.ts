/**
 * Vercel Blob storage helpers
 */

import { put, del, list, head } from "@vercel/blob";

export async function uploadBlob(
  fileName: string,
  data: Buffer | ReadableStream,
  options?: { contentType?: string; access?: "public" },
) {
  const blob = await put(fileName, data, {
    access: options?.access ?? "public",
    contentType: options?.contentType,
  });
  return blob;
}

export async function deleteBlob(url: string) {
  await del(url);
}

export async function listBlobs(prefix?: string) {
  const { blobs } = await list({ prefix });
  return blobs;
}

export async function getBlobMetadata(url: string) {
  const metadata = await head(url);
  return metadata;
}

export async function uploadThumbnail(
  userId: string,
  clipId: string,
  data: Buffer,
): Promise<string> {
  const blob = await put(`thumbnails/${userId}/${clipId}.jpg`, data, {
    access: "public",
    contentType: "image/jpeg",
  });
  return blob.url;
}
