export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Track performance across all your published clips.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Views", value: "0" },
          { label: "Total Likes", value: "0" },
          { label: "Avg. Retention", value: "0%" },
          { label: "Best Clip Score", value: "—" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="rounded-lg border p-6">
        <h2 className="text-lg font-semibold">Performance Over Time</h2>
        <div className="mt-4 h-64 rounded bg-muted">
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Chart will render here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
