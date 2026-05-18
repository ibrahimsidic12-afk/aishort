import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

interface VideosPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 10;

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  UPLOADING: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", dot: "bg-yellow-500" },
  PROCESSING: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500 animate-pulse" },
  TRANSCRIBING: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500 animate-pulse" },
  READY: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
  ERROR: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
};

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const statusFilter = params.status || "all";
  const page = Math.max(1, parseInt(params.page || "1", 10));

  const where: Record<string, unknown> = { userId: user.id };
  if (statusFilter !== "all") {
    where.status = statusFilter.toUpperCase();
  }

  const [videos, totalCount] = await Promise.all([
    db.video.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { clips: true, jobs: true } },
      },
    }),
    db.video.count({ where: where as any }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">My Videos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount} video{totalCount !== 1 ? "s" : ""} uploaded
          </p>
        </div>
        <Link
          href="/uploads"
          className="flex items-center gap-1.5 rounded-lg gradient-bg px-4 py-2.5 text-sm font-medium text-white shadow-glow transition-all hover:shadow-glow-lg hover:brightness-110"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
          Upload
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "UPLOADING", "PROCESSING", "TRANSCRIBING", "READY", "ERROR"].map((s) => {
          const isActive = statusFilter === (s === "all" ? "all" : s.toLowerCase());
          const href = s === "all" ? "/videos" : `/videos?status=${s.toLowerCase()}`;
          return (
            <Link
              key={s}
              href={href}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isActive || (s === "all" && statusFilter === "all")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </Link>
          );
        })}
      </div>

      {/* Video List */}
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-16 text-center">
          <div className="rounded-2xl bg-muted p-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold">No videos yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Upload your first video to start generating clips.</p>
          <Link href="/uploads" className="mt-4 rounded-lg gradient-bg px-4 py-2 text-sm font-medium text-white shadow-glow">
            Upload Video
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => {
            const statusCfg = STATUS_CONFIG[video.status] || STATUS_CONFIG.PROCESSING;
            return (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
              >
                {/* Thumbnail placeholder */}
                <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold group-hover:text-primary transition-colors">
                    {video.title}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    {video.duration && (
                      <span>{Math.round(video.duration / 60)} min</span>
                    )}
                    <span>{(video.fileSize / (1024 * 1024)).toFixed(0)} MB</span>
                    <span>{video._count.clips} clip{video._count.clips !== 1 ? "s" : ""}</span>
                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Status */}
                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                  {video.status}
                </span>

                {/* Arrow */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-1 group-hover:text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/videos?page=${page - 1}${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-secondary"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/videos?page=${page + 1}${statusFilter !== "all" ? `&status=${statusFilter}` : ""}`}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-secondary"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
