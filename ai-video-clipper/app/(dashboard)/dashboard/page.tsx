export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s your overview.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Videos", value: "0" },
          { label: "Clips Generated", value: "0" },
          { label: "Published", value: "0" },
          { label: "Credits Left", value: "10" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <p className="mt-4 text-sm text-muted-foreground">
          No recent activity. Upload a video to get started!
        </p>
      </div>
    </div>
  );
}
