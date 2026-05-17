import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDuration } from "@/lib/utils/date";
import { formatFileSize } from "@/lib/utils/format";

export default async function VideosPage() {
  const { userId: clerkId } = auth();
  if (!clerkId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/login");

  const videos = await prisma.video.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { clips: true } },
      transcript: { select: { id: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Videos</h1>
          <p className="text-muted-foreground">
            {videos.length} video{videos.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>
        <Link
          href="/uploads"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Upload Video
        </Link>
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed p-12 text-center">
          <span className="text-4xl">🎬</span>
          <h3 className="mt-4 text-lg font-medium">No videos yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Upload your first video to start generating viral clips.
          </p>
          <Link
            href="/uploads"
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Upload Video
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <Link
              key={video.id}
              href={`/videos/${video.id}`}
              className="flex items-center gap-4 rounded-lg border p-4 transition hover:border-primary/50 hover:shadow-sm"
            >
              {/* Thumbnail placeholder */}
              <div className="h-16 w-28 shrink-0 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                {video.duration ? formatDuration(video.duration) : "—"}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{video.title}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{video.fileName}</span>
                  {video.fileSize > 0 && <span>{formatFileSize(video.fileSize)}</span>}
                  <span>{video._count.clips} clips</span>
                </div>
              </div>

              {/* Status */}
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  video.status === "READY"
                    ? "bg-green-100 text-green-700"
                    : video.status === "ERROR"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {video.status === "READY"
                  ? "Ready"
                  : video.status === "ERROR"
                    ? "Error"
                    : "Processing"}
              </span>

              {/* Transcript badge */}
              {video.transcript && (
                <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                  Transcribed
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
