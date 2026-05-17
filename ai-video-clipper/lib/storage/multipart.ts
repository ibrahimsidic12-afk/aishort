/**
 * Multipart upload bridge
 */

import {
  initiateMultipartUpload as initUpload,
  getPartPresignedUrl,
  completeMultipartUpload as completeUpload,
} from "@/lib/storage/upload";

interface InitiateResult {
  uploadId: string;
  key: string;
}

interface CompleteResult {
  key: string;
  uploadId: string;
}

/**
 * Initiate a multipart upload to R2
 */
export async function initiateMultipartUpload(
  key: string,
  contentType: string,
): Promise<InitiateResult> {
  const result = await initUpload(key, contentType);
  return { uploadId: result.uploadId, key: result.key };
}

/**
 * Generate a presigned URL for uploading a single part
 */
export async function generatePartPresignedUrl(
  key: string,
  uploadId: string,
  partNumber: number,
): Promise<string> {
  return getPartPresignedUrl(key, uploadId, partNumber);
}

/**
 * Complete a multipart upload after all parts are uploaded
 */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: Array<{ partNumber: number; etag: string }>,
): Promise<CompleteResult> {
  await completeUpload(key, uploadId, parts);
  return { key, uploadId };
}
