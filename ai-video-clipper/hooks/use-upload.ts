"use client";

import { useState, useCallback } from "react";

interface UploadState {
  file: File | null;
  progress: number;
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  error: string | null;
  videoId: string | null;
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    file: null,
    progress: 0,
    status: "idle",
    error: null,
    videoId: null,
  });

  const upload = useCallback(async (file: File) => {
    setState({ file, progress: 0, status: "uploading", error: null, videoId: null });

    try {
      // Step 1: Get presigned URL
      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
      });
      const { uploadUrl, key } = await presignRes.json();

      // Step 2: Upload to storage
      // TODO: Use XHR for progress tracking
      await fetch(uploadUrl, { method: "PUT", body: file });
      setState((s) => ({ ...s, progress: 80 }));

      // Step 3: Complete upload
      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        body: JSON.stringify({ key, fileName: file.name }),
      });
      const { videoId } = await completeRes.json();

      setState({ file, progress: 100, status: "complete", error: null, videoId });
    } catch (err) {
      setState((s) => ({
        ...s,
        status: "error",
        error: err instanceof Error ? err.message : "Upload failed",
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({ file: null, progress: 0, status: "idle", error: null, videoId: null });
  }, []);

  return { ...state, upload, reset };
}
