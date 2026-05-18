"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { JobStatus } from "@/types";

interface JobStatusState {
  status: JobStatus;
  progress: number;
  error: string | null;
  result: Record<string, unknown> | null;
}

/**
 * Hook for tracking job status via Server-Sent Events (SSE)
 * Falls back to polling if SSE is not available
 */
export function useJobStatus(jobId: string | null, options?: { pollInterval?: number }) {
  const [state, setState] = useState<JobStatusState>({
    status: "QUEUED",
    progress: 0,
    error: null,
    result: null,
  });
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  const { pollInterval = 2000 } = options || {};

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    if (!jobId) return;

    // Try SSE first
    const connectSSE = () => {
      try {
        const eventSource = new EventSource(`/api/jobs/stream?jobId=${jobId}`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setState({
              status: data.status,
              progress: data.progress,
              error: data.error,
              result: data.result,
            });

            // Close connection when job is complete
            if (data.status === "COMPLETED" || data.status === "FAILED" || data.status === "CANCELLED") {
              eventSource.close();
              eventSourceRef.current = null;
            }
          } catch {
            // Ignore parse errors
          }
        };

        eventSource.onerror = () => {
          // SSE failed, fall back to polling
          eventSource.close();
          eventSourceRef.current = null;
          startPolling();
        };
      } catch {
        // EventSource not supported, fall back to polling
        startPolling();
      }
    };

    // Polling fallback
    const startPolling = () => {
      const poll = async () => {
        try {
          const res = await fetch(`/api/jobs/status?jobId=${jobId}`);
          if (!res.ok) return;
          const data = await res.json();
          setState({
            status: data.status,
            progress: data.progress,
            error: data.error,
            result: data.result,
          });

          if (data.status === "COMPLETED" || data.status === "FAILED" || data.status === "CANCELLED") {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = undefined;
            }
          }
        } catch {
          // Retry on next interval
        }
      };

      poll();
      pollIntervalRef.current = setInterval(poll, pollInterval);
    };

    connectSSE();

    return cleanup;
  }, [jobId, pollInterval, cleanup]);

  return { ...state, cleanup };
}
