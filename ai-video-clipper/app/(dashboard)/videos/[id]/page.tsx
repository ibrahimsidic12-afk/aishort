import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GenerateClipsButton } from "@/components/video/generate-clips-button";

interface VideoDetailPageProps {
  params: Promise<{ id: string }>;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  UPLOADING: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", dot: "bg-yellow-500", label: "Uploading" },
  PROCESSING: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500 animate-pulse", label: "Processing" },
  TRANSCRIBING: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500 animate-pulse", label: "Transcribing" },
  READY: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", dot: "bg-green-500", label: "Ready" },
  ERROR: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", dot: "bg-red-500", label: "Error" },
};

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Video Details</h1>
        <p className="text-muted-foreground">Loading your account...</p>
      </div>
    );
  }

  const { id } = await params;

  const video = await db.video.findFirst({
    where: { id, userId: user.id },
    include: {
      transcript: { select: { id: true, language: true, provider: true, createdAt: true } },
      clips: {
        orderBy: { score: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          duration: true,
          score: true,
          viralityScore: true,
          status: true,
          createdAt: true,
        },
      },
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, type: true, status: true, progress: true, createdAt: true },
      },
    },
  });

  if (!video) notFound();

  const statusCfg = STATUS_CONFIG[video.status] || STATUS_CONFIG.PROCESSING;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/videos" className="hover:text-foreground transition-colors">Videos</Link>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
        <span className="truncate font-medium text-foreground">{video.title}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold sm:text-3xl">{video.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {video.duration && <span>{Math.round(video.duration / 60)} min</span>}
            <span>{(video.fileSize / (1024 * 1024)).toFixed(0)} MB</span>
            <span>{video.mimeType}</span>
            <span>Uploaded {new Date(video.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
          <span className={`h-2 w-2 rounded-full ${statusCfg.dot}`} />
          {statusCfg.label}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Video preview */}
          <div className="overflow-hidden rounded-xl border bg-card shadow-card">
            {video.storageUrl ? (
              <video
                src={video.storageUrl}
                controls
                className="aspect-video w-full bg-black"
                preload="metadata"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-muted">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <p className="mt-2 text-sm text-muted-foreground">Video preview not available</p>
                </div>
              </div>
            )}
          </div>

          {/* Clips */}
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Generated Clips ({video.clips.length})</h2>
              {video.status === "READY" && (
                <Link
                  href={`/clips?video=${video.id}`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View all clips
                </Link>
              )}
            </div>

            {video.clips.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {video.status === "READY"
                    ? "No clips generated yet."
                    : "Clips will appear here once the video is transcribed."}
                </p>
                {video.status === "READY" && (
                  <GenerateClipsButton videoId={video.id} maxClips={10} />
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {video.clips.map((clip) => (
                  <Link
                    key={clip.id}
                    href={`/clips/${clip.id}`}
                    className="group flex items-center justify-between rounded-lg border p-3 transition-all hover:border-primary/30 hover:bg-accent/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary transition-colors">
                        {clip.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {Math.round(clip.duration)}s
                        {clip.score != null && ` · Score: ${Math.round(clip.score)}`}
                        {clip.viralityScore != null && ` · Viral: ${Math.round(clip.viralityScore)}`}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      clip.status === "READY" ? "bg-green-500/10 text-green-600" :
                      clip.status === "PUBLISHED" ? "bg-emerald-500/10 text-emerald-600" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {clip.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <h3 className="text-sm font-semibold">Details</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">File Name</dt>
                <dd className="truncate max-w-[160px] font-medium">{video.fileName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="font-medium">{video.duration ? `${Math.round(video.duration / 60)} min` : "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Size</dt>
                <dd className="font-medium">{(video.fileSize / (1024 * 1024)).toFixed(1)} MB</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Format</dt>
                <dd className="font-medium">{video.mimeType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Uploaded</dt>
                <dd className="font-medium">{new Date(video.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          {/* Transcription */}
          <div className="rounded-xl border bg-card p-6 shadow-card">
            <h3 className="text-sm font-semibold">Transcription</h3>
            {video.transcript ? (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-green-600 dark:text-green-400 font-medium">Complete</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Provider: {video.transcript.provider} &middot; Language: {video.transcript.language || "en"}
                </p>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                <span>{video.status === "TRANSCRIBING" ? "In progress..." : "Not started"}</span>
              </div>
            )}
          </div>

          {/* Recent Jobs */}
          {video.jobs.length > 0 && (
            <div className="rounded-xl border bg-card p-6 shadow-card">
              <h3 className="text-sm font-semibold">Processing Jobs</h3>
              <div className="mt-3 space-y-2">
                {video.jobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {job.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 font-medium ${
                      job.status === "COMPLETED" ? "bg-green-500/10 text-green-600" :
                      job.status === "PROCESSING" ? "bg-blue-500/10 text-blue-600" :
                      job.status === "FAILED" ? "bg-red-500/10 text-red-600" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
