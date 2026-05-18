"use client";

import { useState, useCallback, useRef } from "react";

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
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const upload = useCallback(async (file: File) => {
    setState({ file, progress: 0, status: "uploading", error: null, videoId: null });

    try {
      // Step 1: Get presigned URL
      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, fileType: file.type, fileSize: file.size }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json();
        throw new Error(err.error || "Failed to get upload URL");
      }

      const { uploadUrl, key } = await presignRes.json();

      // Step 2: Upload to storage using XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 80); // 0-80% for upload
            setState((s) => ({ ...s, progress: percentComplete }));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload cancelled"));
        });

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      xhrRef.current = null;
      setState((s) => ({ ...s, progress: 85, status: "processing" }));

      // Step 3: Complete upload - notify backend
      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, fileName: file.name, fileSize: file.size, mimeType: file.type }),
      });

      if (!completeRes.ok) {
        const err = await completeRes.json();
        throw new Error(err.error || "Failed to complete upload");
      }

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

  const cancel = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setState({ file: null, progress: 0, status: "idle", error: null, videoId: null });
  }, []);

  const reset = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setState({ file: null, progress: 0, status: "idle", error: null, videoId: null });
  }, []);

  return { ...state, upload, cancel, reset };
}
