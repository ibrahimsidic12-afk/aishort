import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getUserUsageStats } from "@/lib/quota";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    // Don't redirect to /login here — middleware already protects this route.
    // If getCurrentUser returns null, it means DB is unavailable.
    // Show a minimal fallback instead of causing a redirect loop.
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="rounded-2xl bg-muted p-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 0 0 1.75-2.75L13.75 4a2 2 0 0 0-3.5 0L3.32 16.25A2 2 0 0 0 5.07 19Z" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold">Setting up your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please wait a moment while we connect to the database. If this persists, contact support.
        </p>
        <Link href="/dashboard" className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Refresh
        </Link>
      </div>
    );
  }

  // Fetch real stats in parallel
  let videoCount = 0;
  let clipCount = 0;
  let publishedCount = 0;
  let recentVideos: any[] = [];
  let recentJobs: any[] = [];
  let usageStats: any = null;

  try {
    [videoCount, clipCount, publishedCount, recentVideos, recentJobs, usageStats] =
      await Promise.all([
        db.video.count({ where: { userId: user.id } }),
        db.clip.count({ where: { userId: user.id } }),
        db.clip.count({ where: { userId: user.id, status: "PUBLISHED" } }),
        db.video.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            duration: true,
            _count: { select: { clips: true } },
          },
        }),
        db.job.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true,
            completedAt: true,
          },
        }),
        getUserUsageStats(user.id),
      ]);
  } catch (error) {
    console.error("[DASHBOARD] Database query failed:", error);
    // Continue with defaults (zeros) instead of crashing
  }

  const stats = [
    {
      label: "Total Videos",
      value: videoCount,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" /></svg>
      ),
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    },
    {
      label: "Clips Generated",
      value: clipCount,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><path d="M20 4 8.12 15.88" /><circle cx="6" cy="18" r="3" /><path d="M14.8 14.8 20 20" /></svg>
      ),
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-violet-500/10 dark:bg-violet-500/20",
    },
    {
      label: "Published",
      value: publishedCount,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
      ),
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    },
    {
      label: "Credits Left",
      value: usageStats?.credits ?? user.credits,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
      ),
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl gradient-bg p-8 text-white">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold sm:text-3xl">
            Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="mt-2 max-w-lg text-sm text-white/80">
            Ready to create viral content? Upload a video and let AI find your best moments.
          </p>
          <Link
            href="/uploads"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
            Upload New Video
          </Link>
        </div>
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -right-4 h-24 w-24 rounded-full bg-white/5" />
        <div className="absolute left-1/2 top-0 h-32 w-32 rounded-full bg-white/5" />
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-2.5 ${stat.bgColor}`}>
                <span className={`bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                  {stat.icon}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
            {/* Hover gradient line */}
            <div className={`absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r ${stat.color} opacity-0 transition-opacity group-hover:opacity-100`} />
          </div>
        ))}
      </div>

      {/* Usage & Activity */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Usage quota */}
        {usageStats && (
          <div className="rounded-xl border bg-card p-6 shadow-card lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Monthly Usage</h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {usageStats.plan}
              </span>
            </div>
            <div className="mt-5 space-y-4">
              <UsageBar
                label="Videos"
                used={usageStats.usage.videos.used}
                limit={usageStats.usage.videos.limit}
                color="bg-blue-500"
              />
              <UsageBar
                label="Clips"
                used={usageStats.usage.clips.used}
                limit={usageStats.usage.clips.limit}
                color="bg-violet-500"
              />
              <UsageBar
                label="Publishes"
                used={usageStats.usage.publishes.used}
                limit={usageStats.usage.publishes.limit}
                color="bg-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Recent Videos */}
        <div className="rounded-xl border bg-card p-6 shadow-card lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent Videos</h2>
            <Link href="/videos" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {recentVideos.length === 0 ? (
            <div className="mt-8 flex flex-col items-center text-center">
              <div className="rounded-full bg-muted p-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" /></svg>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">No videos yet</p>
              <Link href="/uploads" className="mt-2 text-xs font-medium text-primary hover:underline">
                Upload your first video
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {recentVideos.map((video) => (
                <Link
                  key={video.id}
                  href={`/videos/${video.id}`}
                  className="flex items-center justify-between rounded-lg border border-transparent p-3 transition-all hover:border-border hover:bg-accent/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{video.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {video.duration ? `${Math.round(video.duration / 60)} min` : "Processing"} &middot;{" "}
                      {video._count.clips} clips &middot;{" "}
                      {new Date(video.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={video.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <div className="rounded-xl border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent Activity</h2>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <JobIcon type={job.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {job.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <JobStatusBadge status={job.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UsageBar({ label, used, limit, color }: { label: string; used: number; limit: number; color: string }) {
  const percentage = Math.min(100, Math.round((used / limit) * 100));
  const isNearLimit = percentage >= 80;

  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {used}<span className="text-muted-foreground">/{limit}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isNearLimit ? "bg-destructive" : color
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    UPLOADING: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", dot: "bg-yellow-500" },
    PROCESSING: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
    TRANSCRIBING: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500" },
    READY: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
    ERROR: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
  };
  const c = config[status] || config.PROCESSING;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    QUEUED: { bg: "bg-gray-500/10", text: "text-gray-600 dark:text-gray-400" },
    PROCESSING: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
    COMPLETED: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400" },
    FAILED: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400" },
    CANCELLED: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400" },
  };
  const c = config[status] || config.QUEUED;

  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${c.bg} ${c.text}`}>
      {status}
    </span>
  );
}

function JobIcon({ type }: { type: string }) {
  const iconClass = "h-4 w-4 text-muted-foreground";
  switch (type) {
    case "TRANSCRIPTION":
      return (
        <div className="rounded-lg bg-purple-500/10 p-2">
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
        </div>
      );
    case "CLIP_GENERATION":
      return (
        <div className="rounded-lg bg-blue-500/10 p-2">
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="6" cy="6" r="3" /><path d="M8.12 8.12 12 12" /><circle cx="6" cy="18" r="3" /></svg>
        </div>
      );
    case "PUBLISH":
      return (
        <div className="rounded-lg bg-green-500/10 p-2">
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>
        </div>
      );
    default:
      return (
        <div className="rounded-lg bg-muted p-2">
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></svg>
        </div>
      );
  }
}
