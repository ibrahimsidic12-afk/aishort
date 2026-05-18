import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { getUserUsageStats } from "@/lib/quota";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Fetch real stats in parallel
  const [videoCount, clipCount, publishedCount, recentVideos, recentJobs, usageStats] =
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

  const stats = [
    { label: "Total Videos", value: videoCount.toString() },
    { label: "Clips Generated", value: clipCount.toString() },
    { label: "Published", value: publishedCount.toString() },
    { label: "Credits Left", value: (usageStats?.credits ?? user.credits).toString() },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back{user.name ? `, ${user.name}` : ""}! Here&apos;s your overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Usage quota */}
      {usageStats && (
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Monthly Usage ({usageStats.plan} Plan)</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <UsageBar
              label="Videos"
              used={usageStats.usage.videos.used}
              limit={usageStats.usage.videos.limit}
            />
            <UsageBar
              label="Clips"
              used={usageStats.usage.clips.used}
              limit={usageStats.usage.clips.limit}
            />
            <UsageBar
              label="Publishes"
              used={usageStats.usage.publishes.used}
              limit={usageStats.usage.publishes.limit}
            />
          </div>
        </div>
      )}

      {/* Recent Videos */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Recent Videos</h2>
        {recentVideos.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No videos yet. Upload a video to get started!
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {recentVideos.map((video) => (
              <div
                key={video.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="font-medium">{video.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {video.duration ? `${Math.round(video.duration / 60)} min` : "Processing"} &middot;{" "}
                    {video._count.clips} clips &middot;{" "}
                    {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={video.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Jobs */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Recent Jobs</h2>
        {recentJobs.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {job.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(job.createdAt).toLocaleString()}
                  </p>
                </div>
                <JobStatusBadge status={job.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percentage = Math.min(100, Math.round((used / limit) * 100));
  const isNearLimit = percentage >= 80;

  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {used}/{limit}
        </span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all ${
            isNearLimit ? "bg-destructive" : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    UPLOADING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    TRANSCRIBING: "bg-purple-100 text-purple-800",
    READY: "bg-green-100 text-green-800",
    ERROR: "bg-red-100 text-red-800",
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    QUEUED: "bg-gray-100 text-gray-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    CANCELLED: "bg-yellow-100 text-yellow-800",
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
