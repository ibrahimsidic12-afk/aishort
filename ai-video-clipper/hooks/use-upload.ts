"use client";

import { useState, useCallback, useRef } from "react";

interface UploadState {
  file: File | null;
  progress: number;
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  error: string | null;
  videoId: string | null;
  jobId: string | null;
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    file: null,
    progress: 0,
    status: "idle",
    error: null,
    videoId: null,
    jobId: null,
  });
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const upload = useCallback(async (file: File) => {
    setState({ file, progress: 0, status: "uploading", error: null, videoId: null, jobId: null });

    try {
      // Step 1: Get presigned URL
      const presignRes = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      if (!presignRes.ok) {
        const err = await presignRes.json();
        throw new Error(err.error || "Failed to get upload URL");
      }

      const { uploadUrl, key } = await presignRes.json();

      // Step 2: Upload to R2 with progress tracking via XHR
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 75); // 0-75% for upload
            setState((s) => ({ ...s, progress: pct }));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed (network error)"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setState((s) => ({ ...s, progress: 80, status: "processing" }));

      // Step 3: Complete upload and trigger processing
      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, fileName: file.name }),
      });

      if (!completeRes.ok) {
        const err = await completeRes.json();
        throw new Error(err.error || "Failed to complete upload");
      }

      const { videoId, jobId } = await completeRes.json();

      setState({
        file,
        progress: 100,
        status: "complete",
        error: null,
        videoId,
        jobId,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        status: "error",
        error: err instanceof Error ? err.message : "Upload failed",
      }));
    }
  }, []);

  const cancel = useCallback(() => {
    xhrRef.current?.abort();
    setState((s) => ({ ...s, status: "idle", progress: 0 }));
  }, []);

  const reset = useCallback(() => {
    setState({ file: null, progress: 0, status: "idle", error: null, videoId: null, jobId: null });
  }, []);

  return { ...state, upload, cancel, reset };
}
