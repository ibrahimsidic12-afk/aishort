import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ClipDetailClient } from "./client";

interface ClipDetailPageProps {
  params: { id: string };
}

export default async function ClipDetailPage({ params }: ClipDetailPageProps) {
  const { userId: clerkId } = auth();
  if (!clerkId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/login");

  const clip = await prisma.clip.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      video: {
        select: { id: true, title: true, storageKey: true, duration: true },
      },
      publications: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!clip) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/videos/${clip.videoId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to {clip.video.title}
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{clip.title}</h1>
        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
          <span>{Math.round(clip.duration)}s</span>
          {clip.score !== null && (
            <span>Score: {Math.round(clip.score * 100)}%</span>
          )}
          {clip.viralityScore !== null && (
            <span>Virality: {Math.round(clip.viralityScore * 100)}%</span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              clip.status === "READY"
                ? "bg-green-100 text-green-700"
                : clip.status === "PUBLISHED"
                  ? "bg-purple-100 text-purple-700"
                  : clip.status === "RENDERING"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
            }`}
          >
            {clip.status.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Client interactive section */}
      <ClipDetailClient
        clip={{
          id: clip.id,
          title: clip.title,
          description: clip.description,
          startTime: clip.startTime,
          endTime: clip.endTime,
          duration: clip.duration,
          score: clip.score,
          viralityScore: clip.viralityScore,
          status: clip.status,
          tags: clip.tags,
          captions: clip.captions as any,
          storageKey: clip.storageKey,
          thumbnailUrl: clip.thumbnailUrl,
        }}
        video={{
          id: clip.video.id,
          title: clip.video.title,
          storageKey: clip.video.storageKey,
          duration: clip.video.duration ?? 0,
        }}
        publications={clip.publications.map((p) => ({
          id: p.id,
          platform: p.platform,
          status: p.status,
          url: p.url,
          publishedAt: p.publishedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
