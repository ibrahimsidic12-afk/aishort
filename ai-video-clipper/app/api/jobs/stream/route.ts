import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

/**
 * SSE endpoint for streaming job status updates
 * GET /api/jobs/stream?jobId=xxx
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return new Response("Missing jobId parameter", { status: 400 });
  }

  // Verify job belongs to user
  const job = await db.job.findFirst({
    where: { id: jobId, userId: user.id },
  });

  if (!job) {
    return new Response("Job not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      // Send initial state
      sendEvent({
        id: job.id,
        status: job.status,
        progress: job.progress,
        error: job.error,
        result: job.result,
      });

      // If job is already in a terminal state, close immediately
      if (job.status === "COMPLETED" || job.status === "FAILED" || job.status === "CANCELLED") {
        controller.close();
        return;
      }

      // Poll database and push updates via SSE
      const pollInterval = 1500; // 1.5 seconds
      let lastStatus: string = job.status;
      let lastProgress: number = job.progress;

      const interval = setInterval(async () => {
        try {
          const updated = await db.job.findUnique({
            where: { id: jobId },
            select: {
              id: true,
              status: true,
              progress: true,
              error: true,
              result: true,
              completedAt: true,
            },
          });

          if (!updated) {
            sendEvent({ id: jobId, status: "FAILED", progress: 0, error: "Job not found" });
            clearInterval(interval);
            controller.close();
            return;
          }

          // Only send updates when something changed
          if (updated.status !== lastStatus || updated.progress !== lastProgress) {
            lastStatus = updated.status;
            lastProgress = updated.progress;

            sendEvent({
              id: updated.id,
              status: updated.status,
              progress: updated.progress,
              error: updated.error,
              result: updated.result,
            });
          }

          // Close stream when job is done
          if (
            updated.status === "COMPLETED" ||
            updated.status === "FAILED" ||
            updated.status === "CANCELLED"
          ) {
            clearInterval(interval);
            controller.close();
          }
        } catch (error) {
          console.error("[SSE] Error polling job:", error);
          sendEvent({ id: jobId, status: "FAILED", progress: 0, error: "Stream error" });
          clearInterval(interval);
          controller.close();
        }
      }, pollInterval);

      // Clean up on client disconnect (abort signal)
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
