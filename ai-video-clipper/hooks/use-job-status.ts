"use client";

import { useState, useEffect, useRef } from "react";
import type { JobStatus } from "@/types";

interface JobStatusState {
  status: JobStatus;
  progress: number;
  error: string | null;
  result: Record<string, unknown> | null;
}

export function useJobStatus(jobId: string | null, pollInterval = 2000) {
  const [state, setState] = useState<JobStatusState>({
    status: "QUEUED",
    progress: 0,
    error: null,
    result: null,
  });
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/status?jobId=${jobId}`);
        const data = await res.json();
        setState({
          status: data.status,
          progress: data.progress,
          error: data.error,
          result: data.result,
        });

        if (data.status === "COMPLETED" || data.status === "FAILED" || data.status === "CANCELLED") {
          clearInterval(intervalRef.current);
        }
      } catch {
        // Retry on next interval
      }
    };

    poll();
    intervalRef.current = setInterval(poll, pollInterval);

    return () => clearInterval(intervalRef.current);
  }, [jobId, pollInterval]);

  return state;
}
