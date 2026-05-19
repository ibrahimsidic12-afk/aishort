import { prisma } from "../db/prisma";

export async function handleJobCallback(payload: {
  jobId: string;
  type?: string;
  status: string;
  result?: unknown;
  error?: string | null;
}): Promise<void> {
  console.log("[JOBS_CALLBACKS] handleJobCallback:", payload.jobId, payload.type, payload.status);

  // Update the job record
  await prisma.job.updateMany({
    where: { id: payload.jobId },
    data: {
      status: payload.status as any,
      progress: payload.status === "COMPLETED" ? 100 : undefined,
      result: payload.result as any,
      error: payload.error ?? null,
      completedAt: payload.status === "COMPLETED" || payload.status === "FAILED" ? new Date() : undefined,
    },
  });

  // If transcription completed, update video status to READY
  if (payload.type === "TRANSCRIPTION" && payload.status === "COMPLETED") {
    const job = await prisma.job.findUnique({
      where: { id: payload.jobId },
      select: { videoId: true },
    });

    if (job?.videoId) {
      await prisma.video.update({
        where: { id: job.videoId },
        data: { status: "READY" },
      });
      console.log("[JOBS_CALLBACKS] Video marked READY:", job.videoId);
    }
  }

  // If transcription failed, update video status to ERROR
  if (payload.type === "TRANSCRIPTION" && payload.status === "FAILED") {
    const job = await prisma.job.findUnique({
      where: { id: payload.jobId },
      select: { videoId: true },
    });

    if (job?.videoId) {
      await prisma.video.update({
        where: { id: job.videoId },
        data: { status: "ERROR" },
      });
    }
  }
}
