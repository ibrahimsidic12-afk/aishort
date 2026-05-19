import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ClipCard } from "@/components/video/clip-card";
import { ClipsFilters } from "@/components/clips/clips-filters";
import { ClipsPagination } from "@/components/clips/clips-pagination";
import { ClipsBulkActions } from "@/components/clips/clips-bulk-actions";

// Always render per-request — clip data is per-user and changes often.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const fetchCache = "force-no-store";

const PAGE_SIZE = 12;

export default async function ClipsPage({ searchParams }: { searchParams: Promise<{ status?: string; sort?: string; search?: string; page?: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Clips</h1>
        <p className="text-muted-foreground">Loading your account...</p>
      </div>
    );
  }

  const params = await searchParams;
  const status = params.status || "all";
  const sort = params.sort || "score";
  const search = params.search || "";
  const page = Math.max(1, parseInt(params.page || "1", 10));

  // Build query filters
  const where: Record<string, unknown> = { userId: user.id };

  if (status !== "all") {
    where.status = status.toUpperCase();
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" as const } },
      { tags: { has: search } },
    ];
  }

  // Build sort order (use createdAt as default to avoid null ordering issues)
  let orderBy: Record<string, unknown>;
  switch (sort) {
    case "date":
      orderBy = { createdAt: "desc" };
      break;
    case "duration":
      orderBy = { duration: "desc" };
      break;
    case "virality":
      orderBy = { viralityScore: { sort: "desc", nulls: "last" } };
      break;
    case "score":
      orderBy = { score: { sort: "desc", nulls: "last" } };
      break;
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  // Fetch clips with pagination
  let clips: any[] = [];
  let totalCount = 0;

  try {
    [clips, totalCount] = await Promise.all([
      db.clip.findMany({
        where: where as any,
        orderBy: orderBy as any,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          video: { select: { title: true, id: true } },
          _count: { select: { publications: true } },
        },
      }),
      db.clip.count({ where: where as any }),
    ]);
  } catch (error) {
    console.error("[CLIPS_PAGE] Database query failed:", error);
    // Return empty state gracefully instead of crashing
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Clips</h1>
          <p className="text-muted-foreground">
            {totalCount} clip{totalCount !== 1 ? "s" : ""} generated
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <ClipsFilters
        currentStatus={status}
        currentSort={sort}
        currentSearch={search}
      />

      {/* Bulk Actions */}
      <ClipsBulkActions clipIds={clips.map((c) => c.id)} />

      {/* Clips Grid */}
      {clips.length === 0 ? (
        <EmptyState search={search} status={status} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {clips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={{
                id: clip.id,
                userId: clip.userId,
                videoId: clip.videoId,
                title: clip.title,
                description: clip.description,
                startTime: clip.startTime,
                endTime: clip.endTime,
                duration: clip.duration,
                storageKey: clip.storageKey,
                storageUrl: clip.storageUrl,
                thumbnailUrl: clip.thumbnailUrl,
                status: clip.status as any,
                score: clip.score,
                viralityScore: clip.viralityScore,
                tags: clip.tags,
                captions: clip.captions as any,
                metadata: clip.metadata as any,
                publishedAt: clip.publishedAt,
                createdAt: clip.createdAt,
                updatedAt: clip.updatedAt,
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <ClipsPagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
        />
      )}
    </div>
  );
}

function EmptyState({ search, status }: { search: string; status: string }) {
  if (search || status !== "all") {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium">No clips found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-7 7m7-7l-7-7" />
      </svg>
      <h3 className="mt-4 text-lg font-medium">No clips yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload a video and generate clips to get started.
      </p>
      <a
        href="/uploads"
        className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Upload Video
      </a>
    </div>
  );
}
