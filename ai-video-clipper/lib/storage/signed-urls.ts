/**
 * Generate signed URLs for assets
 */

import { getR2SignedUrl } from "./r2";
import { SIGNED_URL_EXPIRY } from "@/lib/constants";

export async function getVideoUrl(storageKey: string): Promise<string> {
  return getR2SignedUrl(storageKey, SIGNED_URL_EXPIRY.DOWNLOAD);
}

export async function getClipUrl(storageKey: string): Promise<string> {
  return getR2SignedUrl(storageKey, SIGNED_URL_EXPIRY.DOWNLOAD);
}

export async function getThumbnailUrl(storageKey: string): Promise<string> {
  return getR2SignedUrl(storageKey, SIGNED_URL_EXPIRY.THUMBNAIL);
}

export async function getDownloadUrl(storageKey: string, fileName: string): Promise<string> {
  // For download, we use Content-Disposition header via signed URL
  return getR2SignedUrl(storageKey, SIGNED_URL_EXPIRY.DOWNLOAD);
}

/**
 * Get public URL if R2_PUBLIC_URL is set, otherwise generate signed URL
 */
export async function getPublicOrSignedUrl(storageKey: string): Promise<string> {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl}/${storageKey}`;
  }
  return getR2SignedUrl(storageKey, SIGNED_URL_EXPIRY.DOWNLOAD);
}
