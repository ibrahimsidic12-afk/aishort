"use client";

import { useState } from "react";

interface Clip {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  storageUrl: string | null;
}

interface ClipsListActionsProps {
  clips: Clip[];
  videoStorageUrl: string | null;
  videoTitle: string;
}

export function ClipsListActions({ clips, videoStorageUrl, videoTitle }: ClipsListActionsProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadClip = async (clip: Clip) => {
    const url = clip.storageUrl || videoStorageUrl;
    if (!url) {
      alert("Video file not available for download");
      return;
    }

    setDownloading(clip.id);
    try {
      // Open the source video at the clip's start time
      // Browsers don't natively trim videos client-side, so we download the source
      // and let the user trim it manually, OR redirect to a video URL with timestamp
      const link = document.createElement("a");
      link.href = `${url}#t=${clip.startTime},${clip.endTime}`;
      link.download = `${(clip.title || "clip").replace(/[^a-zA-Z0-9]/g, "_")}.mp4`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Download failed: " + (err instanceof Error ? err.message : "unknown error"));
    } finally {
      setDownloading(null);
    }
  };

  const exportAllAsJSON = () => {
    const data = {
      video: { title: videoTitle, storageUrl: videoStorageUrl },
      clips: clips.map((c) => ({
        title: c.title,
        startTime: c.startTime,
        endTime: c.endTime,
        duration: c.endTime - c.startTime,
        sourceVideo: videoStorageUrl,
      })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${videoTitle.replace(/[^a-zA-Z0-9]/g, "_")}_clips.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAll = async () => {
    for (const clip of clips) {
      await downloadClip(clip);
      // Small delay between downloads to avoid browser blocking
      await new Promise((r) => setTimeout(r, 500));
    }
  };

  if (clips.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
      <button
        onClick={downloadAll}
        className="flex items-center gap-2 rounded-lg gradient-bg px-3 py-2 text-xs font-medium text-white shadow-glow transition-all hover:brightness-110"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
        Download All ({clips.length})
      </button>

      <button
        onClick={exportAllAsJSON}
        className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-medium hover:bg-secondary transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
        Export Metadata (JSON)
      </button>

      {downloading && (
        <span className="text-xs text-muted-foreground">Downloading...</span>
      )}
    </div>
  );
}
