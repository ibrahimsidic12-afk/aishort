import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ClipDetailClient } from "@/components/clips/clip-detail-client";

// Always render per-request — clip data is per-user and changes often.
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ClipDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClipDetailPage({ params }: ClipDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Clip Details</h1>
        <p className="text-muted-foreground">Loading your account...</p>
      </div>
    );
  }

  const { id } = await params;

  const clip = await db.clip.findFirst({
    where: { id, userId: user.id },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          storageUrl: true,
          duration: true,
        },
      },
      publications: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          platform: true,
          status: true,
          url: true,
          publishedAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!clip) notFound();

  // Fetch captions for the clip timeframe
  const transcript = await db.transcript.findUnique({
    where: { videoId: clip.videoId },
    select: { segments: true, language: true },
  });

  let captionSegments: Array<{ start: number; end: number; text: string }> = [];
  if (transcript?.segments) {
    try {
      const allSegments = typeof transcript.segments === "string"
        ? JSON.parse(transcript.segments)
        : transcript.segments;

      if (Array.isArray(allSegments)) {
        captionSegments = allSegments
          .filter((seg: any) => seg.start >= clip.startTime && seg.end <= clip.endTime)
          .map((seg: any) => ({
            start: seg.start - clip.startTime,
            end: seg.end - clip.startTime,
            text: seg.text,
          }));
      }
    } catch {
      // Ignore parse errors
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/clips" className="hover:text-foreground">
          My Clips
        </Link>
        <span>/</span>
        <span className="text-foreground">{clip.title}</span>
      </nav>

      {/* Main content */}
      <ClipDetailClient
        clip={{
          id: clip.id,
          title: clip.title,
          description: clip.description,
          startTime: clip.startTime,
          endTime: clip.endTime,
          duration: clip.duration,
          status: clip.status,
          score: clip.score,
          viralityScore: clip.viralityScore,
          tags: clip.tags,
          storageUrl: clip.storageUrl,
          thumbnailUrl: clip.thumbnailUrl,
          createdAt: clip.createdAt.toISOString(),
          publishedAt: clip.publishedAt?.toISOString() || null,
        }}
        video={{
          id: clip.video.id,
          title: clip.video.title,
          storageUrl: clip.video.storageUrl,
          duration: clip.video.duration,
        }}
        publications={clip.publications.map((p) => ({
          id: p.id,
          platform: p.platform,
          status: p.status,
          url: p.url,
          publishedAt: p.publishedAt?.toISOString() || null,
        }))}
        captionSegments={captionSegments}
      />
    </div>
  );
}
