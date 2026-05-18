"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const YOUTUBE_URL_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S*)?$/;

type ImportStatus = "idle" | "validating" | "importing" | "success" | "error";

interface ImportResult {
  videoId: string;
  jobId: string;
  title: string;
  youtubeId: string;
}

export function YouTubeImport() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const videoId = url.match(YOUTUBE_URL_REGEX)?.[1] || null;
  const isValidUrl = !!videoId;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text");
    if (YOUTUBE_URL_REGEX.test(pasted.trim())) {
      setUrl(pasted.trim());
      setError(null);
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!isValidUrl) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setStatus("importing");
    setError(null);

    try {
      const res = await fetch("/api/import/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title: title || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Failed to import video");

        // If duplicate, offer to navigate
        if (data.code === "DUPLICATE_IMPORT" && data.videoId) {
          setResult({ videoId: data.videoId, jobId: "", title: "", youtubeId: videoId! });
        }
        return;
      }

      setStatus("success");
      setResult(data);
    } catch {
      setStatus("error");
      setError("Network error. Please check your connection and try again.");
    }
  }, [url, title, isValidUrl, videoId]);

  const handleReset = useCallback(() => {
    setUrl("");
    setTitle("");
    setStatus("idle");
    setError(null);
    setResult(null);
    inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-5">
      {/* URL Input */}
      {status !== "success" && (
        <div className="space-y-3">
          <div>
            <label htmlFor="youtube-url" className="text-sm font-medium">
              YouTube Video URL
            </label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              <input
                ref={inputRef}
                id="youtube-url"
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                  setStatus("idle");
                }}
                onPaste={handlePaste}
                placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                disabled={status === "importing"}
                className={`w-full rounded-lg border bg-background py-3 pl-11 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-60 ${
                  error ? "border-destructive focus:ring-destructive/20" : isValidUrl ? "border-green-500 focus:ring-green-500/20" : ""
                }`}
              />
              {/* Validation indicator */}
              {url && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidUrl ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><line x1="15" x2="9" y1="9" y2="15" /><line x1="9" x2="15" y1="9" y2="15" />
                    </svg>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Video Preview */}
          {isValidUrl && thumbnailUrl && (
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3 animate-fade-in">
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="h-16 w-28 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">YouTube Video</p>
                <p className="mt-0.5 truncate text-sm font-medium">{videoId}</p>
                <p className="text-xs text-green-600 dark:text-green-400">Ready to import</p>
              </div>
            </div>
          )}

          {/* Optional title */}
          {isValidUrl && (
            <div className="animate-fade-in">
              <label htmlFor="video-title" className="text-sm font-medium">
                Custom Title <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="video-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Leave empty to use YouTube title"
                maxLength={200}
                disabled={status === "importing"}
                className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-60"
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 animate-fade-in">
              <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 shrink-0 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-destructive">{error}</p>
                {result?.videoId && (
                  <button
                    onClick={() => router.push(`/videos/${result.videoId}`)}
                    className="mt-1 text-xs font-medium text-primary hover:underline"
                  >
                    View existing video →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={!isValidUrl || status === "importing"}
            className="flex w-full items-center justify-center gap-2 rounded-lg gradient-bg px-4 py-3 text-sm font-medium text-white shadow-glow transition-all hover:shadow-glow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {status === "importing" ? (
              <>
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Importing...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                Import from YouTube
              </>
            )}
          </button>
        </div>
      )}

      {/* Success State */}
      {status === "success" && result && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-800 dark:text-green-300">Import successful!</p>
              <p className="mt-0.5 text-sm text-green-700/80 dark:text-green-400/70">
                {result.title || "Your YouTube video"} is being processed. AI transcription will start shortly.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/videos/${result.videoId}`)}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              View Video
            </button>
            <button
              onClick={handleReset}
              className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Import Another
            </button>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="rounded-lg border border-dashed p-4">
        <p className="text-xs font-medium text-muted-foreground">Supported URL formats:</p>
        <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground/80">
          <li>• youtube.com/watch?v=VIDEO_ID</li>
          <li>• youtu.be/VIDEO_ID</li>
          <li>• youtube.com/shorts/VIDEO_ID</li>
          <li>• youtube.com/embed/VIDEO_ID</li>
        </ul>
      </div>
    </div>
  );
}
