"use client";

import { useJobStatus } from "@/hooks/use-job-status";
import Link from "next/link";

interface JobStatusTrackerProps {
  jobId: string;
  onComplete?: (result: Record<string, unknown>) => void;
  showVideo?: boolean;
}

const STATUS_CONFIG = {
  QUEUED: { icon: "⏳", label: "Queued", color: "text-gray-600", bgColor: "bg-gray-100" },
  PROCESSING: { icon: "⚙️", label: "Processing", color: "text-blue-600", bgColor: "bg-blue-100" },
  COMPLETED: { icon: "✅", label: "Complete", color: "text-green-600", bgColor: "bg-green-100" },
  FAILED: { icon: "❌", label: "Failed", color: "text-red-600", bgColor: "bg-red-100" },
  CANCELLED: { icon: "🚫", label: "Cancelled", color: "text-gray-600", bgColor: "bg-gray-100" },
};

const JOB_TYPE_LABELS: Record<string, string> = {
  TRANSCRIPTION: "Transcribing video",
  CLIP_GENERATION: "Generating clips with AI",
  CLIP_RENDERING: "Rendering clip",
  THUMBNAIL_GENERATION: "Creating thumbnails",
  PUBLISH: "Publishing to platform",
  CLEANUP: "Cleaning up",
};

export function JobStatusTracker({ jobId, onComplete, showVideo = true }: JobStatusTrackerProps) {
  const { status, progress, error, result } = useJobStatus(jobId);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.QUEUED;
  const isActive = status === "QUEUED" || status === "PROCESSING";
  const isDone = status === "COMPLETED";
  const isFailed = status === "FAILED";

  // Notify parent on completion
  if (isDone && result && onComplete) {
    onComplete(result);
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-xl">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.color}`}>
            {config.label}
          </p>
          {isActive && (
            <p className="text-xs text-muted-foreground">
              {JOB_TYPE_LABELS[(result as any)?.type] || "Processing..."}
            </p>
          )}
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.bgColor} ${config.color}`}>
          {status.toLowerCase()}
        </span>
      </div>

      {/* Progress bar */}
      {isActive && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress}%</span>
            {progress > 0 && progress < 100 && (
              <span className="animate-pulse">Working...</span>
            )}
          </div>
        </div>
      )}

      {/* Animated dots for queued */}
      {status === "QUEUED" && (
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          <span className="ml-2 text-xs text-muted-foreground">Waiting in queue...</span>
        </div>
      )}

      {/* Error message */}
      {isFailed && error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
          <button className="mt-2 text-xs font-medium text-red-600 hover:underline">
            Retry Job
          </button>
        </div>
      )}

      {/* Completion result */}
      {isDone && result && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3">
          <p className="text-sm text-green-700">
            {(result as any).clipIds
              ? `Generated ${(result as any).clipIds.length} clips!`
              : "Job completed successfully."}
          </p>
          {(result as any).clipIds && (
            <Link
              href="/clips"
              className="mt-2 inline-block text-xs font-medium text-green-600 hover:underline"
            >
              View Clips →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
