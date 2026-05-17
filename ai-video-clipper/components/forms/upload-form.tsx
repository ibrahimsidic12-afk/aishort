"use client";

import { useState, useCallback } from "react";

interface UploadFormProps {
  onUploadComplete?: (videoId: string) => void;
}

export function UploadForm({ onUploadComplete }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type.startsWith("video/")) {
      setFile(droppedFile);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    // TODO: Get presigned URL, upload file, call complete
    setProgress(100);
    setUploading(false);
    onUploadComplete?.("video_id");
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="flex flex-col items-center rounded-lg border-2 border-dashed p-12"
    >
      {file ? (
        <div className="space-y-4 text-center">
          <p className="text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </p>
          {uploading && (
            <div className="h-2 w-64 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      ) : (
        <>
          <p className="text-lg font-medium">Drop your video here</p>
          <p className="mt-2 text-sm text-muted-foreground">MP4, MOV, WEBM up to 2GB</p>
          <label className="mt-6 cursor-pointer rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Browse Files
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </>
      )}
    </div>
  );
}
