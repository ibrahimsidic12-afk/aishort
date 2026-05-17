"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VideoPlayer } from "@/components/video/video-player";
import { TimelineEditor } from "@/components/video/timeline-editor";
import { CaptionEditor } from "@/components/video/caption-editor";
import { JobStatusTracker } from "@/components/common/job-status-tracker";
import type { CaptionData } from "@/types";

interface ClipInfo {
  id: string;
  title: string;
  description: string | null;
  startTime: number;
  endTime: number;
  duration: number;
  score: number | null;
  viralityScore: number | null;
  status: string;
  tags: string[];
  captions: CaptionData | null;
  storageKey: string | null;
  thumbnailUrl: string | null;
}

interface VideoInfo {
  id: string;
  title: string;
  storageKey: string;
  duration: number;
}

interface Publication {
  id: string;
  platform: string;
  status: string;
  url: string | null;
  publishedAt: string | null;
}

interface ClipDetailClientProps {
  clip: ClipInfo;
  video: VideoInfo;
  publications: Publication[];
}

export function ClipDetailClient({ clip, video, publications }: ClipDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"preview" | "captions" | "publish">("preview");
  const [currentTime, setCurrentTime] = useState(clip.startTime);
  const [startTime, setStartTime] = useState(clip.startTime);
  const [endTime, setEndTime] = useState(clip.endTime);
  const [renderJobId, setRenderJobId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const handleRangeChange = (start: number, end: number) => {
    setStartTime(start);
    setEndTime(end);
  };

  const handleRender = async () => {
    try {
      const res = await fetch("/api/clips/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId: clip.id,
          settings: {
            resolution: "1080p",
            format: "mp4",
            quality: 85,
            includeCaptions: true,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to render");
        return;
      }

      const { jobId } = await res.json();
      setRenderJobId(jobId);
    } catch {
      alert("Render failed");
    }
  };

  const handlePublish = async (platform: "YOUTUBE" | "TIKTOK") => {
    setPublishing(true);
    try {
      const res = await fetch("/api/clips/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId: clip.id,
          platform: platform.toLowerCase(),
          options: { title: clip.title, tags: clip.tags },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Publish failed");
        return;
      }

      router.refresh();
    } catch {
      alert("Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveCaptions = async (captions: CaptionData) => {
    try {
      await fetch("/api/clips/captions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId: clip.id, captions: captions.segments, style: captions.style }),
      });
    } catch {
      alert("Failed to save captions");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this clip?")) return;

    try {
      await fetch("/api/clips/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId: clip.id }),
      });
      router.push(`/videos/${video.id}`);
    } catch {
      alert("Delete failed");
    }
  };

  const tabs = [
    { key: "preview", label: "Preview" },
    { key: "captions", label: "Captions" },
    { key: "publish", label: "Publish" },
  ] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main area */}
      <div className="lg:col-span-2 space-y-4">
        {/* Video Player — show rendered clip if available, otherwise source with range */}
        <VideoPlayer
          src={clip.storageKey ? `/api/stream/${clip.storageKey}` : `/api/stream/${video.storageKey}`}
          startTime={clip.storageKey ? 0 : clip.startTime}
          endTime={clip.storageKey ? undefined : clip.endTime}
          onTimeUpdate={setCurrentTime}
          autoLoop
          className="w-full rounded-lg"
        />

        {/* Timeline Editor */}
        <TimelineEditor
          duration={video.duration}
          startTime={startTime}
          endTime={endTime}
          currentTime={currentTime}
          onRangeChange={handleRangeChange}
          minClipDuration={15}
          maxClipDuration={180}
        />

        {/* Render Job Tracker */}
        {renderJobId && (
          <JobStatusTracker
            jobId={renderJobId}
            onComplete={() => {
              router.refresh();
              setRenderJobId(null);
            }}
          />
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex rounded-lg border p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "preview" && (
          <div className="space-y-4">
            {/* Scores */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Quality</p>
                <p className="text-lg font-bold">
                  {clip.score !== null ? `${Math.round(clip.score * 100)}%` : "—"}
                </p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Virality</p>
                <p className="text-lg font-bold">
                  {clip.viralityScore !== null
                    ? `${Math.round(clip.viralityScore * 100)}%`
                    : "—"}
                </p>
              </div>
            </div>

            {/* Tags */}
            {clip.tags.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {clip.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {clip.status === "PENDING" || clip.status === "READY" ? (
                <button
                  onClick={handleRender}
                  className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Render Clip (1080p)
                </button>
              ) : null}

              <button
                onClick={handleDelete}
                className="w-full rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                Delete Clip
              </button>
            </div>
          </div>
        )}

        {activeTab === "captions" && (
          <CaptionEditor
            initialCaptions={
              clip.captions ?? {
                segments: [],
                style: {
                  fontFamily: "Arial",
                  fontSize: 64,
                  fontColor: "#FFFFFF",
                  backgroundColor: "rgba(0,0,0,0.6)",
                  position: "bottom",
                  animation: "pop",
                },
              }
            }
            onSave={handleSaveCaptions}
            currentTime={currentTime - clip.startTime}
          />
        )}

        {activeTab === "publish" && (
          <div className="space-y-4">
            {clip.status !== "READY" && clip.status !== "PUBLISHED" ? (
              <p className="text-sm text-muted-foreground">
                Clip must be rendered before publishing.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Publish this clip to your connected platforms.
                </p>

                <button
                  onClick={() => handlePublish("YOUTUBE")}
                  disabled={publishing}
                  className="w-full rounded-md border px-4 py-3 text-left hover:bg-secondary disabled:opacity-50"
                >
                  <p className="font-medium text-sm">YouTube Shorts</p>
                  <p className="text-xs text-muted-foreground">
                    Publish as a YouTube Short
                  </p>
                </button>

                <button
                  onClick={() => handlePublish("TIKTOK")}
                  disabled={publishing}
                  className="w-full rounded-md border px-4 py-3 text-left hover:bg-secondary disabled:opacity-50"
                >
                  <p className="font-medium text-sm">TikTok</p>
                  <p className="text-xs text-muted-foreground">
                    Publish to TikTok
                  </p>
                </button>
              </>
            )}

            {/* Publication history */}
            {publications.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold mb-2">Published</p>
                <div className="space-y-2">
                  {publications.map((pub) => (
                    <div
                      key={pub.id}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div>
                        <p className="text-xs font-medium capitalize">
                          {pub.platform.toLowerCase()}
                        </p>
                        {pub.publishedAt && (
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(pub.publishedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                            pub.status === "PUBLISHED"
                              ? "bg-green-100 text-green-700"
                              : pub.status === "FAILED"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {pub.status.toLowerCase()}
                        </span>
                        {pub.url && (
                          <a
                            href={pub.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
