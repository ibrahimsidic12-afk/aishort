import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { formatDuration } from "@/lib/utils/date";
import { formatFileSize } from "@/lib/utils/format";
import { VideoDetailClient } from "./client";

interface VideoDetailPageProps {
  params: { id: string };
}

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { userId: clerkId } = auth();
  if (!clerkId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/login");

  const video = await prisma.video.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      transcript: true,
      clips: {
        orderBy: { score: "desc" },
      },
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!video) notFound();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/videos" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Videos
          </Link>
          <h1 className="mt-2 text-3xl font-bold">{video.title}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{video.fileName}</span>
            {video.fileSize > 0 && <span>{formatFileSize(video.fileSize)}</span>}
            {video.duration && <span>{formatDuration(video.duration)}</span>}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                video.status === "READY"
                  ? "bg-green-100 text-green-700"
                  : video.status === "ERROR"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
              }`}
            >
              {video.status.toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Client-side interactive section */}
      <VideoDetailClient
        videoId={video.id}
        videoStatus={video.status}
        storageKey={video.storageKey}
        duration={video.duration ?? 0}
        hasTranscript={!!video.transcript}
        transcriptContent={video.transcript?.content ?? null}
        transcriptSegments={(video.transcript?.segments as any[]) ?? []}
        clips={video.clips.map((c) => ({
          id: c.id,
          title: c.title,
          startTime: c.startTime,
          endTime: c.endTime,
          duration: c.duration,
          score: c.score,
          status: c.status,
          thumbnailUrl: c.thumbnailUrl,
        }))}
        jobs={video.jobs.map((j) => ({
          id: j.id,
          type: j.type,
          status: j.status,
          progress: j.progress,
          createdAt: j.createdAt.toISOString(),
        }))}
        credits={user.credits}
      />
    </div>
  );
}
