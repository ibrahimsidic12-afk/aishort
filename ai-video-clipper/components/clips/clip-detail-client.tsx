"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipVideoPlayer } from "./clip-video-player";
import { ClipCaptionPreview } from "./clip-caption-preview";
import { ClipEditForm } from "@/components/forms/clip-edit-form";

interface ClipData {
  id: string;
  title: string;
  description: string | null;
  startTime: number;
  endTime: number;
  duration: number;
  status: string;
  score: number | null;
  viralityScore: number | null;
  tags: string[];
  storageUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  publishedAt: string | null;
}

interface VideoData {
  id: string;
  title: string;
  storageUrl: string | null;
  duration: number | null;
}

interface Publication {
  id: string;
  platform: string;
  status: string;
  url: string | null;
  publishedAt: string | null;
}

interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

interface ClipDetailClientProps {
  clip: ClipData;
  video: VideoData;
  publications: Publication[];
  captionSegments: CaptionSegment[];
}

const PLATFORM_ICONS: Record<string, string> = {
  YOUTUBE: "YT",
  TIKTOK: "TT",
  INSTAGRAM: "IG",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  GENERATING: "bg-blue-100 text-blue-800",
  RENDERING: "bg-purple-100 text-purple-800",
  READY: "bg-green-100 text-green-800",
  PUBLISHED: "bg-emerald-100 text-emerald-800",
  ERROR: "bg-red-100 text-red-800",
};

export function ClipDetailClient({
  clip,
  video,
  publications,
  captionSegments,
}: ClipDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"preview" | "edit" | "captions" | "publish">("preview");
  const [isDeleting, setIsDeleting] = useState(false);
  const [publishingPlatform, setPublishingPlatform] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm("Delete this clip? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/clips/delete?clipId=${clip.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/clips");
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete clip");
      }
    } catch {
      alert("Failed to delete clip");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async (platform: string) => {
    setPublishingPlatform(platform);
    try {
      const res = await fetch("/api/clips/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId: clip.id,
          platform,
          metadata: {
            title: clip.title,
            description: clip.description || "",
            tags: clip.tags,
          },
        }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to publish");
      }
    } catch {
      alert("Failed to publish clip");
    } finally {
      setPublishingPlatform(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
      {/* Left: Video Player & Tabs */}
      <div className="space-y-4">
        {/* Video Player */}
        <ClipVideoPlayer
          videoUrl={clip.storageUrl || video.storageUrl}
          startTime={clip.startTime}
          endTime={clip.endTime}
          thumbnailUrl={clip.thumbnailUrl}
        />

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex gap-4">
            {(["preview", "captions", "edit", "publish"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 pb-2 text-sm font-medium capitalize transition ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {activeTab === "preview" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="mt-1 text-sm">
                  {clip.description || "No description provided."}
                </p>
              </div>
              {clip.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {clip.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-secondary px-3 py-1 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Source Video</h3>
                <Link
                  href={`/videos/${video.id}`}
                  className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  {video.title}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Clip Range:</span>{" "}
                  {formatTimestamp(clip.startTime)} - {formatTimestamp(clip.endTime)}
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>{" "}
                  {new Date(clip.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {activeTab === "captions" && (
            <ClipCaptionPreview segments={captionSegments} duration={clip.duration} />
          )}

          {activeTab === "edit" && (
            <ClipEditForm
              clipId={clip.id}
              initialTitle={clip.title}
              initialDescription={clip.description || ""}
              initialTags={clip.tags}
            />
          )}

          {activeTab === "publish" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Publish this clip to your connected platforms.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {["youtube", "tiktok", "instagram"].map((platform) => {
                  const isPublished = publications.some(
                    (p) => p.platform === platform.toUpperCase() && p.status === "PUBLISHED"
                  );
                  const isPending = publications.some(
                    (p) => p.platform === platform.toUpperCase() && p.status === "PENDING"
                  );

                  return (
                    <button
                      key={platform}
                      onClick={() => handlePublish(platform)}
                      disabled={!!publishingPlatform || isPublished}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition ${
                        isPublished
                          ? "border-green-200 bg-green-50 dark:bg-green-900/10"
                          : "hover:border-primary/50 hover:bg-primary/5"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span className="text-lg font-bold">
                        {PLATFORM_ICONS[platform.toUpperCase()] || platform}
                      </span>
                      <span className="capitalize">{platform}</span>
                      {isPublished && (
                        <span className="text-xs text-green-600">Published</span>
                      )}
                      {isPending && (
                        <span className="text-xs text-yellow-600">Pending...</span>
                      )}
                      {publishingPlatform === platform && (
                        <span className="text-xs text-blue-600">Publishing...</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Publish History */}
              {publications.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground">Publish History</h3>
                  <div className="mt-2 space-y-2">
                    {publications.map((pub) => (
                      <div key={pub.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {PLATFORM_ICONS[pub.platform] || pub.platform}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            pub.status === "PUBLISHED" ? "bg-green-100 text-green-800" :
                            pub.status === "FAILED" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {pub.status}
                          </span>
                        </div>
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
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Sidebar with scores & actions */}
      <div className="space-y-6">
        {/* Title & Status */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold leading-tight">{clip.title}</h1>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              STATUS_STYLES[clip.status] || "bg-gray-100 text-gray-800"
            }`}>
              {clip.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDuration(clip.duration)} duration
          </p>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-3">
          <ScoreCard
            label="Quality Score"
            value={clip.score}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            }
          />
          <ScoreCard
            label="Virality Score"
            value={clip.viralityScore}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
            }
          />
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab("publish")}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Publish Clip
          </button>
          <button
            onClick={() => setActiveTab("edit")}
            className="w-full rounded-md border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
          >
            Edit Details
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full rounded-md border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Clip"}
          </button>
        </div>

        {/* Regenerate */}
        <div className="rounded-lg border border-dashed p-4">
          <p className="text-xs text-muted-foreground">
            Not happy with this clip? You can regenerate clips from the source video.
          </p>
          <Link
            href={`/videos/${video.id}`}
            className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
          >
            Go to source video
          </Link>
        </div>
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | null;
  icon: React.ReactNode;
}) {
  const getColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      {value != null ? (
        <div className="mt-2">
          <span className={`text-2xl font-bold ${getColor(value)}`}>
            {Math.round(value)}
          </span>
          <span className="text-sm text-muted-foreground">/100</span>
          {/* Progress bar */}
          <div className="mt-1 h-1.5 w-full rounded-full bg-secondary">
            <div
              className={`h-full rounded-full ${
                value >= 80 ? "bg-green-500" :
                value >= 60 ? "bg-yellow-500" :
                value >= 40 ? "bg-orange-500" : "bg-red-500"
              }`}
              style={{ width: `${Math.min(100, value)}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-2 text-lg font-bold text-muted-foreground">--</p>
      )}
    </div>
  );
}
