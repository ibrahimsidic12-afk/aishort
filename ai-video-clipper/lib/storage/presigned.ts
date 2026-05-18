import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface PresignedResponse {
  uploadUrl: string;
  key: string;
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const bucketName = process.env.R2_BUCKET_NAME!;

export async function generatePresignedUrl(input: {
  key: string;
  expiresIn?: number;
}): Promise<PresignedResponse> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: input.key,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: input.expiresIn || 3600, // 1 hour default
  });

  return { uploadUrl, key: input.key };
}

export async function deleteStorageObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  await s3Client.send(command);
}

export function getPublicUrl(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }
  return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${key}`;
}
