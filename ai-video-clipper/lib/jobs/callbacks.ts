import { prisma } from "../db/prisma";

export async function handleJobCallback(payload: {
  jobId: string;
  type?: string;
  status: string;
  result?: unknown;
  error?: string | null;
}): Promise<void> {
  console.warn("[JOBS_CALLBACKS] handleJobCallback: stub", payload.jobId);
  await prisma.job.updateMany({
    where: { id: payload.jobId },
    data: {
      status: payload.status as any,
      progress: payload.status === "COMPLETED" ? 100 : undefined,
      result: payload.result as any,
      error: payload.error ?? null,
      completedAt: payload.status === "COMPLETED" ? new Date() : undefined,
    },
  });
}
