import { prisma } from "../db/prisma";

export async function triggerVideoProcessing(input: {
  videoId: string;
  userId: string;
}): Promise<{ jobId: string[] }> {
  console.warn("[JOBS_PROCESSING] triggerVideoProcessing: stub");
  return { jobId: [] };
}
