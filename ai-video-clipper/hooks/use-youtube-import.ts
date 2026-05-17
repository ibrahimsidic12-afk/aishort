"use client";

import { useState, useCallback } from "react";

interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  channel: string;
  thumbnail: string;
  description: string;
}

interface YouTubeImportState {
  url: string;
  status: "idle" | "previewing" | "previewed" | "importing" | "complete" | "error";
  info: VideoInfo | null;
  withinLimits: boolean;
  progress: number;
  error: string | null;
  videoId: string | null;
  jobId: string | null;
}

export function useYouTubeImport() {
  const [state, setState] = useState<YouTubeImportState>({
    url: "",
    status: "idle",
    info: null,
    withinLimits: true,
    progress: 0,
    error: null,
    videoId: null,
    jobId: null,
  });

  /**
   * Preview video info from URL (fast, no download)
   */
  const preview = useCallback(async (url: string) => {
    setState((s) => ({ ...s, url, status: "previewing", error: null, info: null }));

    try {
      const res = await fetch(`/api/upload/youtube-url?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (!res.ok) {
        setState((s) => ({ ...s, status: "error", error: data.error }));
        return;
      }

      setState((s) => ({
        ...s,
        status: "previewed",
        info: data.info,
        withinLimits: data.withinLimits,
      }));
    } catch {
      setState((s) => ({ ...s, status: "error", error: "Failed to preview video" }));
    }
  }, []);

  /**
   * Import the video (download + process)
   */
  const importVideo = useCallback(async () => {
    if (!state.url) return;

    setState((s) => ({ ...s, status: "importing", progress: 10, error: null }));

    try {
      // Simulate progress while waiting (download takes time)
      const progressInterval = setInterval(() => {
        setState((s) => {
          if (s.progress < 80) {
            return { ...s, progress: s.progress + Math.random() * 5 };
          }
          return s;
        });
      }, 2000);

      const res = await fetch("/api/upload/youtube-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: state.url }),
      });

      clearInterval(progressInterval);

      const data = await res.json();

      if (!res.ok) {
        setState((s) => ({ ...s, status: "error", error: data.error, progress: 0 }));
        return;
      }

      setState((s) => ({
        ...s,
        status: "complete",
        progress: 100,
        videoId: data.videoId,
        jobId: data.jobId,
        info: data.info ?? s.info,
      }));
    } catch {
      setState((s) => ({ ...s, status: "error", error: "Import failed. Please try again.", progress: 0 }));
    }
  }, [state.url]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      url: "",
      status: "idle",
      info: null,
      withinLimits: true,
      progress: 0,
      error: null,
      videoId: null,
      jobId: null,
    });
  }, []);

  /**
   * Set URL (for controlled input)
   */
  const setUrl = useCallback((url: string) => {
    setState((s) => ({ ...s, url, status: "idle", error: null, info: null }));
  }, []);

  return {
    ...state,
    setUrl,
    preview,
    importVideo,
    reset,
  };
}
