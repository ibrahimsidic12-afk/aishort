import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDuration } from "@/lib/utils/date";

export default async function DashboardPage() {
  const { userId: clerkId } = auth();
  if (!clerkId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });
  if (!user) redirect("/login");

  // Fetch real stats
  const [totalVideos, totalClips, totalPublished, recentJobs, recentClips] =
    await Promise.all([
      prisma.video.count({ where: { userId: user.id } }),
      prisma.clip.count({ where: { userId: user.id } }),
      prisma.clip.count({ where: { userId: user.id, status: "PUBLISHED" } }),
      prisma.job.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { video: { select: { title: true } } },
      }),
      prisma.clip.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { video: { select: { title: true } } },
      }),
    ]);

  const stats = [
    { label: "Total Videos", value: totalVideos.toString(), href: "/videos" },
    { label: "Clips Generated", value: totalClips.toString(), href: "/clips" },
    { label: "Published", value: totalPublished.toString(), href: "/clips" },
    { label: "Credits Left", value: user.credits.toString(), href: "/billing" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user.name || "there"}! Here&apos;s your overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border p-4 transition hover:border-primary/50 hover:shadow-sm"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link
          href="/uploads"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Upload Video
        </Link>
        <Link
          href="/clips"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-secondary"
        >
          View All Clips
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Jobs */}
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Recent Jobs</h2>
          {recentJobs.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No jobs yet. Upload a video to get started!
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {job.video?.title || "Unknown Video"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {job.type.toLowerCase().replace(/_/g, " ")}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      job.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : job.status === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : job.status === "PROCESSING"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {job.status.toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Clips */}
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">Recent Clips</h2>
          {recentClips.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No clips yet. Generate some from your videos!
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {recentClips.map((clip) => (
                <Link
                  key={clip.id}
                  href={`/clips/${clip.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-secondary/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{clip.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(clip.duration)}s
                      {clip.score && ` • Score: ${Math.round(clip.score * 100)}%`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      clip.status === "READY"
                        ? "bg-green-100 text-green-700"
                        : clip.status === "PUBLISHED"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {clip.status.toLowerCase()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
