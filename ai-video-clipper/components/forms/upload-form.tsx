"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUpload } from "@/hooks/use-upload";

interface UploadFormProps {
  onUploadComplete?: (videoId: string, jobId: string) => void;
}

export function UploadForm({ onUploadComplete }: UploadFormProps) {
  const router = useRouter();
  const { file, progress, status, error, videoId, jobId, upload, cancel, reset } =
    useUpload();

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile?.type.startsWith("video/")) {
        upload(droppedFile);
      }
    },
    [upload],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        upload(selectedFile);
      }
    },
    [upload],
  );

  // Navigate on complete
  if (status === "complete" && videoId) {
    onUploadComplete?.(videoId, jobId!);
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="flex flex-col items-center rounded-lg border-2 border-dashed p-12 transition hover:border-primary/50"
    >
      {status === "idle" && !file && (
        <>
          <div className="mb-4 text-4xl">🎬</div>
          <p className="text-lg font-medium">Drop your video here</p>
          <p className="mt-2 text-sm text-muted-foreground">
            MP4, MOV, WEBM up to 2GB
          </p>
          <label className="mt-6 cursor-pointer rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Browse Files
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </>
      )}

      {(status === "uploading" || status === "processing") && file && (
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="text-3xl">
            {status === "uploading" ? "⬆️" : "⚙️"}
          </div>
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {status === "uploading" ? "Uploading..." : "Processing..."}
              </span>
              <span>{progress}%</span>
            </div>
          </div>

          {status === "uploading" && (
            <button
              onClick={cancel}
              className="rounded-md border px-4 py-1.5 text-xs hover:bg-secondary"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {status === "complete" && (
        <div className="space-y-4 text-center">
          <div className="text-4xl">✅</div>
          <p className="text-lg font-medium">Upload Complete!</p>
          <p className="text-sm text-muted-foreground">
            Your video is being processed. You&apos;ll be notified when clips are ready.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/videos/${videoId}`)}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              View Video
            </button>
            <button
              onClick={reset}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Upload Another
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4 text-center">
          <div className="text-4xl">❌</div>
          <p className="text-lg font-medium">Upload Failed</p>
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
