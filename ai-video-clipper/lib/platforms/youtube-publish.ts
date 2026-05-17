import { uploadToYouTube } from "../platforms/youtube";
import { getYouTubeCredentials } from "../auth/youtube";
import { prisma } from "../db/prisma";

export async function createYouTubePublishJob(input: {
  clipId: string;
}): Promise<{ publicationId: string }> {
  console.warn("[YOUTUBE] createYouTubePublishJob: stub");
  return { publicationId: "" };
}
