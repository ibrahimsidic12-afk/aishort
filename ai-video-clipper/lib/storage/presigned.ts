export interface PresignedResponse {
  uploadUrl: string;
  key: string;
}

export async function generatePresignedUrl(input: {
  key: string;
  expiresIn?: number;
}): Promise<PresignedResponse> {
  console.warn("[PRESIGNED] generatePresignedUrl: stub");
  return { uploadUrl: "", key: input.key };
}
