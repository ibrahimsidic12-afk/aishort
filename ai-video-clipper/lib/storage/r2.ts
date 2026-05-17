/**
 * Cloudflare R2 client setup (S3-compatible)
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

export function getVideoKey(userId: string, fileName: string): string {
  return `videos/${userId}/${Date.now()}_${fileName}`;
}

export function getClipKey(userId: string, clipId: string): string {
  return `clips/${userId}/${clipId}.mp4`;
}

export function getThumbnailKey(userId: string, clipId: string): string {
  return `thumbnails/${userId}/${clipId}.jpg`;
}

export async function uploadToR2(key: string, body: Buffer | ReadableStream, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  return r2Client.send(command);
}

export async function getFromR2(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return r2Client.send(command);
}

export async function deleteFromR2(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return r2Client.send(command);
}

export async function getR2SignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

export { r2Client, BUCKET };
