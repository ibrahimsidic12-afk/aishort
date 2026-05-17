import { prisma } from "../db/prisma";

export interface CreateJobOpts {
  videoId: string;
  userId: string;
  type: string;
  options?: Record<string, unknown>;
}

export async function createProcessingJob(
  opts: CreateJobOpts
): Promise<{ id: string; status: string; type: string; createdAt: Date }> {
  const job: { id: string; status: string; type: string; createdAt: Date } = {
    id: `job_${opts.videoId}`,
    status: "QUEUED",
    type: opts.type,
    createdAt: new Date(),
  } as any;
  return { id: job.id, status: job.status, type: job.type, createdAt: job.createdAt };
}

export async function cancelJob(jobId: string): Promise<void> {
  console.warn("[JOBS] cancelJob: stub");
  await prisma.job.updateMany({
    where: { id: jobId },
    data: { status: "CANCELLED", error: "Cancelled by user" },
  });
}

export async function retryJob(jobId: string): Promise<{ id: string; status: string; retryCount: number }> {
  console.warn("[JOBS] retryJob: stub");
  const job = await prisma.job.update({
    where: { id: jobId },
    data: { status: "QUEUED", progress: 0, error: "" },
  });
  return { id: job.id, status: job.status, retryCount: 1 };
}
