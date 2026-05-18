"use client";

import { useUpload } from "@/hooks/use-upload";
import { YouTubeImport } from "@/components/upload/youtube-import";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ACCEPTED_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

type UploadTab = "file" | "youtube";

export default function UploadsPage() {
  const router = useRouter();
  const { file, progress, status, error, videoId, upload, cancel, reset } = useUpload();
  const [activeTab, setActiveTab] = useState<UploadTab>("file");
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = useCallback(
    (selectedFile: File) => {
      setValidationError(null);

      if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
        setValidationError("Unsupported file format. Please upload MP4, MOV, or WebM.");
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE) {
        setValidationError("File too large. Maximum size is 2GB.");
        return;
      }

      upload(selectedFile);
    },
    [upload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) validateAndUpload(droppedFile);
    },
    [validateAndUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) validateAndUpload(selectedFile);
    },
    [validateAndUpload]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Upload Video</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a video file or import from YouTube to generate AI-powered clips.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex rounded-lg border bg-secondary/30 p-1">
        <button
          onClick={() => setActiveTab("file")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "file"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          Upload File
        </button>
        <button
          onClick={() => setActiveTab("youtube")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === "youtube"
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
          YouTube URL
        </button>
      </div>

      {/* File Upload Tab */}
      {activeTab === "file" && (
        <div className="space-y-6">
          {/* Upload Zone */}
          {status === "idle" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 transition-all duration-300 ${
                dragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border hover:border-primary/50 hover:bg-accent/30"
              }`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-semibold">Drop your video here</p>
              <p className="mt-1 text-sm text-muted-foreground">or click to browse files</p>
              <p className="mt-3 text-xs text-muted-foreground">
                MP4, MOV, WebM &middot; Up to 2GB
              </p>
              <button
                onClick={() => inputRef.current?.click()}
                className="mt-6 rounded-lg gradient-bg px-5 py-2.5 text-sm font-medium text-white shadow-glow transition-all hover:shadow-glow-lg hover:brightness-110"
              >
                Browse Files
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileSelect}
                className="sr-only"
              />
            </div>
          )}

          {/* Upload Progress */}
          {(status === "uploading" || status === "processing") && file && (
            <div className="rounded-2xl border bg-card p-8 shadow-card animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary animate-pulse-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" x2="12" y1="3" y2="15" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB &middot;{" "}
                    {status === "uploading" ? "Uploading..." : "Processing..."}
                  </p>
                </div>
                <button
                  onClick={cancel}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {status === "uploading" ? "Uploading to storage" : "Starting transcription"}
                  </span>
                  <span className="font-medium tabular-nums">{progress}%</span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full gradient-bg transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upload Complete */}
          {status === "complete" && videoId && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-8 dark:border-green-900/30 dark:bg-green-900/10 animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-800 dark:text-green-300">Upload complete!</p>
                  <p className="mt-0.5 text-sm text-green-700/80 dark:text-green-400/70">
                    Your video is being processed. AI transcription will start shortly.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <Link
                  href={`/videos/${videoId}`}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                >
                  View Video
                </Link>
                <button
                  onClick={reset}
                  className="rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors"
                >
                  Upload Another
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {(status === "error" || validationError) && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="15" x2="9" y1="9" y2="15" /><line x1="9" x2="15" y1="9" y2="15" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-destructive">Upload failed</p>
                  <p className="mt-0.5 text-sm text-destructive/80">
                    {validationError || error || "Something went wrong. Please try again."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { reset(); setValidationError(null); }}
                className="mt-4 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* YouTube Import Tab */}
      {activeTab === "youtube" && (
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <YouTubeImport />
        </div>
      )}

      {/* Tips */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: "🎬", title: "Long-form videos", desc: "Works best with 5-60 min content" },
          { icon: "🎯", title: "Clear audio", desc: "AI needs good audio for transcription" },
          { icon: "⚡", title: "Fast processing", desc: "Most videos processed in under 5 min" },
        ].map((tip) => (
          <div key={tip.title} className="rounded-xl border bg-card p-4 shadow-card">
            <span className="text-2xl">{tip.icon}</span>
            <p className="mt-2 text-sm font-medium">{tip.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
