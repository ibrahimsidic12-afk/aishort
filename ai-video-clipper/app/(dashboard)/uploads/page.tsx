"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadForm } from "@/components/forms/upload-form";
import { JobStatusTracker } from "@/components/common/job-status-tracker";
import { useYouTubeImport } from "@/hooks/use-youtube-import";

type Tab = "file" | "youtube";

export default function UploadsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("file");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const {
    url,
    status: ytStatus,
    info: ytInfo,
    withinLimits,
    progress: ytProgress,
    error: ytError,
    videoId: ytVideoId,
    jobId: ytJobId,
    setUrl,
    preview,
    importVideo,
    reset: ytReset,
  } = useYouTubeImport();

  // Handle YouTube URL paste/input
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      preview(url.trim());
    }
  };

  // When YouTube import completes
  if (ytStatus === "complete" && ytJobId && !activeJobId) {
    setActiveJobId(ytJobId);
  }

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Upload Video</h1>
        <p className="text-muted-foreground">
          Upload a file or paste a YouTube URL to start generating clips.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-lg border p-1 w-fit">
        <button
          onClick={() => setActiveTab("file")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            activeTab === "file"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary text-muted-foreground"
          }`}
        >
          📁 Upload File
        </button>
        <button
          onClick={() => setActiveTab("youtube")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            activeTab === "youtube"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary text-muted-foreground"
          }`}
        >
          🎬 YouTube URL
        </button>
      </div>

      {/* File Upload Tab */}
      {activeTab === "file" && (
        <UploadForm
          onUploadComplete={(videoId, jobId) => {
            setActiveJobId(jobId);
          }}
        />
      )}

      {/* YouTube URL Tab */}
      {activeTab === "youtube" && (
        <div className="space-y-6">
          {/* URL Input */}
          {(ytStatus === "idle" || ytStatus === "previewing" || ytStatus === "error") && (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 rounded-md border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!url.trim() || ytStatus === "previewing"}
                  className="shrink-0 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {ytStatus === "previewing" ? "Loading..." : "Preview"}
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Supports: youtube.com/watch, youtu.be, youtube.com/shorts
              </p>

              {ytError && ytStatus === "error" && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{ytError}</p>
                </div>
              )}
            </form>
          )}

          {/* Video Preview Card */}
          {(ytStatus === "previewed" || ytStatus === "importing") && ytInfo && (
            <div className="overflow-hidden rounded-lg border">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-muted">
                {ytInfo.thumbnail && (
                  <img
                    src={ytInfo.thumbnail}
                    alt={ytInfo.title}
                    className="h-full w-full object-cover"
                  />
                )}
                {/* Duration badge */}
                <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs font-medium text-white">
                  {formatDuration(ytInfo.duration)}
                </span>
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-lg leading-tight">{ytInfo.title}</h3>
                <p className="text-sm text-muted-foreground">{ytInfo.channel}</p>

                {/* Duration warning */}
                {!withinLimits && (
                  <div className="rounded-md border border-yellow-500/50 bg-yellow-50 p-3">
                    <p className="text-sm text-yellow-800">
                      This video exceeds your plan&apos;s duration limit. Please upgrade to import longer videos.
                    </p>
                  </div>
                )}

                {/* Import progress */}
                {ytStatus === "importing" && (
                  <div className="space-y-2">
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${ytProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Downloading and processing... This may take a few minutes.
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                {ytStatus === "previewed" && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={importVideo}
                      disabled={!withinLimits}
                      className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      Import & Process
                    </button>
                    <button
                      onClick={ytReset}
                      className="rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Complete state */}
          {ytStatus === "complete" && ytInfo && (
            <div className="rounded-lg border p-6 text-center space-y-4">
              <div className="text-4xl">✅</div>
              <h3 className="text-lg font-semibold">Import Complete!</h3>
              <p className="text-sm text-muted-foreground">
                &ldquo;{ytInfo.title}&rdquo; has been imported and is being processed.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => router.push(`/videos/${ytVideoId}`)}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  View Video
                </button>
                <button
                  onClick={ytReset}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary"
                >
                  Import Another
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Job Tracker */}
      {activeJobId && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Processing Status</h2>
          <JobStatusTracker
            jobId={activeJobId}
            onComplete={() => {
              // Could auto-navigate or show generation prompt
            }}
          />
        </div>
      )}

      {/* Tips */}
      <div className="rounded-lg border p-6 bg-secondary/30">
        <h3 className="font-semibold">Tips for best results</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• Upload videos with clear audio for better transcription</li>
          <li>• Longer videos (10+ minutes) yield more clip candidates</li>
          {activeTab === "file" && (
            <li>• Supported formats: MP4, MOV, WEBM (up to 2GB)</li>
          )}
          {activeTab === "youtube" && (
            <>
              <li>• Only public YouTube videos can be imported</li>
              <li>• Age-restricted or private videos are not supported</li>
              <li>• Download time depends on video length (~1-5 minutes)</li>
            </>
          )}
          <li>• Processing takes 2-5 minutes depending on video length</li>
        </ul>
      </div>
    </div>
  );
}
