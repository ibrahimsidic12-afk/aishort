import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface PresignedResponse {
  uploadUrl: string;
  key: string;
}

const s3Client = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

export async function generatePresignedUrl(input: {
  key: string;
  expiresIn?: number;
}): Promise<PresignedResponse> {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: input.key,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: input.expiresIn || 3600, // 1 hour default
  });

  return { uploadUrl, key: input.key };
}
