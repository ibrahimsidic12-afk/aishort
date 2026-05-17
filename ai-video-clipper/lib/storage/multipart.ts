export async function initiateMultipartUpload(input: {
  key: string;
}): Promise<{ uploadId: string; key: string }> {
  console.warn("[MULTIPART] initiateMultipartUpload: stub");
  return { uploadId: "", key: input.key ?? "" };
}

export async function generatePartPresignedUrl(input: {
  uploadId: string;
  key: string;
  partNumber: number;
}): Promise<{ url: string }> {
  console.warn("[MULTIPART] generatePartPresignedUrl: stub");
  return { url: "" };
}

export async function uploadMultipartPart(input: {
  uploadId: string;
  partNumber: number;
  body: Buffer | string;
}): Promise<{ etag: string; partNumber: number }> {
  console.warn("[MULTIPART] uploadMultipartPart: stub");
  return { etag: "", partNumber: input.partNumber };
}

export async function completeMultipartUpload(input: {
  uploadId: string;
  key: string;
  parts: Array<{ partNumber: number; etag: string }>;
}): Promise<{ success: boolean }> {
  console.warn("[MULTIPART] completeMultipartUpload: stub");
  return { success: true };
}
