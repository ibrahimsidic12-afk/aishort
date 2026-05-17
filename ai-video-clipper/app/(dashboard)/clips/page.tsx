import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

interface ClipsPageProps {
  searchParams: {
    status?: string;
    sort?: string;
    videoId?: string;
  };
}

export default async function ClipsPage({ searchParams }: ClipsPageProps) {
  const { userId: clerkId } = auth();
  if (!clerkId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/login");

  // Build filter
  const where: any = { userId: user.id };
  if (searchParams.status && searchParams.status !== "all") {
    where.status = searchParams.status.toUpperCase();
  }
  if (searchParams.videoId) {
    where.videoId = searchParams.videoId;
  }

  // Build sort
  const orderBy: any =
    searchParams.sort === "date"
      ? { createdAt: "desc" }
      : searchParams.sort === "duration"
        ? { duration: "desc" }
        : { score: "desc" };

  const clips = await prisma.clip.findMany({
    where,
    orderBy,
    include: {
      video: { select: { title: true } },
    },
  });

  const statusCounts = await prisma.clip.groupBy({
    by: ["status"],
    where: { userId: user.id },
    _count: true,
  });

  const totalClips = statusCounts.reduce((sum, s) => sum + s._count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Clips</h1>
        <p className="text-muted-foreground">
          {totalClips} clip{totalClips !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <FilterLink
          href="/clips"
          active={!searchParams.status || searchParams.status === "all"}
          label={`All (${totalClips})`}
        />
        {statusCounts.map((sc) => (
          <FilterLink
            key={sc.status}
            href={`/clips?status=${sc.status.toLowerCase()}`}
            active={searchParams.status === sc.status.toLowerCase()}
            label={`${sc.status.charAt(0) + sc.status.slice(1).toLowerCase()} (${sc._count})`}
          />
        ))}

        {/* Sort */}
        <div className="ml-auto">
          <select
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
            defaultValue={searchParams.sort || "score"}
          >
            <option value="score">Sort by Score</option>
            <option value="date">Sort by Date</option>
            <option value="duration">Sort by Duration</option>
          </select>
        </div>
      </div>

      {/* Clip Grid */}
      {clips.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed p-12 text-center">
          <span className="text-4xl">✂️</span>
          <h3 className="mt-4 text-lg font-medium">No clips yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Clips will appear here once you generate them from a video.
          </p>
          <Link
            href="/videos"
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Go to Videos
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clips.map((clip) => (
            <Link
              key={clip.id}
              href={`/clips/${clip.id}`}
              className="group overflow-hidden rounded-lg border transition hover:border-primary/50 hover:shadow-sm"
            >
              {/* Thumbnail / Preview */}
              <div className="aspect-[9/16] bg-muted relative">
                {clip.thumbnailUrl ? (
                  <img
                    src={clip.thumbnailUrl}
                    alt={clip.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl text-muted-foreground/50">
                    🎬
                  </div>
                )}
                {/* Duration badge */}
                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
                  {Math.round(clip.duration)}s
                </span>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="truncate text-sm font-medium group-hover:text-primary">
                  {clip.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  from {clip.video?.title}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  {clip.score !== null && (
                    <div className="flex items-center gap-1">
                      <div
                        className="h-1.5 w-12 rounded-full bg-muted overflow-hidden"
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(clip.score ?? 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((clip.score ?? 0) * 100)}%
                      </span>
                    </div>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
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
                {/* Tags */}
                {clip.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {clip.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "border bg-background hover:bg-secondary"
      }`}
    >
      {label}
    </Link>
  );
}
