"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VideoPlayer } from "@/components/video/video-player";
import { JobStatusTracker } from "@/components/common/job-status-tracker";

interface ClipData {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  score: number | null;
  status: string;
  thumbnailUrl: string | null;
}

interface JobData {
  id: string;
  type: string;
  status: string;
  progress: number;
  createdAt: string;
}

interface VideoDetailClientProps {
  videoId: string;
  videoStatus: string;
  storageKey: string;
  duration: number;
  hasTranscript: boolean;
  transcriptContent: string | null;
  transcriptSegments: Array<{ start: number; end: number; text: string }>;
  clips: ClipData[];
  jobs: JobData[];
  credits: number;
}

export function VideoDetailClient({
  videoId,
  videoStatus,
  storageKey,
  duration,
  hasTranscript,
  transcriptContent,
  transcriptSegments,
  clips,
  jobs,
  credits,
}: VideoDetailClientProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const handleGenerateClips = async () => {
    if (credits <= 0) {
      alert("Insufficient credits. Please upgrade your plan.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/clips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          preferences: {
            maxClips: 5,
            minDuration: 30,
            maxDuration: 60,
            style: "viral",
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to generate clips");
        return;
      }

      const { jobId } = await res.json();
      setActiveJobId(jobId);
    } catch {
      alert("Failed to generate clips");
    } finally {
      setGenerating(false);
    }
  };

  // Find active segment based on current time
  const activeSegmentIndex = transcriptSegments.findIndex(
    (seg) => currentTime >= seg.start && currentTime <= seg.end,
  );

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Main content - 2 columns */}
      <div className="lg:col-span-2 space-y-6">
        {/* Video Player */}
        <VideoPlayer
          src={`/api/stream/${storageKey}`}
          onTimeUpdate={setCurrentTime}
          className="w-full"
        />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {videoStatus === "READY" && hasTranscript && (
            <button
              onClick={handleGenerateClips}
              disabled={generating || credits <= 0}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {generating ? "Generating..." : `Generate Clips (1 credit)`}
            </button>
          )}

          {hasTranscript && (
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              {showTranscript ? "Hide" : "Show"} Transcript
            </button>
          )}

          {!hasTranscript && videoStatus === "READY" && (
            <p className="text-sm text-muted-foreground">
              Transcription in progress...
            </p>
          )}

          <span className="ml-auto text-sm text-muted-foreground">
            {credits} credits remaining
          </span>
        </div>

        {/* Active Job Tracker */}
        {activeJobId && (
          <JobStatusTracker
            jobId={activeJobId}
            onComplete={() => {
              router.refresh();
              setActiveJobId(null);
            }}
          />
        )}

        {/* Transcript */}
        {showTranscript && transcriptSegments.length > 0 && (
          <div className="rounded-lg border p-4 max-h-[400px] overflow-y-auto">
            <h3 className="text-sm font-semibold mb-3">Transcript</h3>
            <div className="space-y-1">
              {transcriptSegments.map((seg, i) => (
                <p
                  key={i}
                  className={`text-sm py-1 px-2 rounded transition cursor-pointer hover:bg-secondary ${
                    i === activeSegmentIndex
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="text-[10px] font-mono text-muted-foreground mr-2">
                    {Math.floor(seg.start / 60)}:{String(Math.floor(seg.start % 60)).padStart(2, "0")}
                  </span>
                  {seg.text}
                </p>
              ))}
            </div>
          </div>
        )}

        {showTranscript && transcriptSegments.length === 0 && transcriptContent && (
          <div className="rounded-lg border p-4 max-h-[400px] overflow-y-auto">
            <h3 className="text-sm font-semibold mb-3">Transcript</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {transcriptContent}
            </p>
          </div>
        )}
      </div>

      {/* Sidebar - clips & jobs */}
      <div className="space-y-6">
        {/* Generated Clips */}
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-semibold mb-3">
            Clips ({clips.length})
          </h3>

          {clips.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {hasTranscript
                ? 'No clips yet. Click "Generate Clips" to get started.'
                : "Waiting for transcription to complete..."}
            </p>
          ) : (
            <div className="space-y-2">
              {clips.map((clip) => (
                <Link
                  key={clip.id}
                  href={`/clips/${clip.id}`}
                  className="flex items-center gap-3 rounded-md border p-2 hover:bg-secondary/50 transition"
                >
                  {/* Mini thumbnail */}
                  <div className="h-10 w-10 shrink-0 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                    {Math.round(clip.duration)}s
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{clip.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {clip.score !== null && (
                        <span className="text-[10px] text-muted-foreground">
                          {Math.round(clip.score * 100)}%
                        </span>
                      )}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                          clip.status === "READY"
                            ? "bg-green-100 text-green-700"
                            : clip.status === "PUBLISHED"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {clip.status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Jobs */}
        {jobs.length > 0 && (
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-3">Recent Jobs</h3>
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground capitalize">
                    {job.type.toLowerCase().replace(/_/g, " ")}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-medium ${
                      job.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : job.status === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : job.status === "PROCESSING"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {job.status.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
