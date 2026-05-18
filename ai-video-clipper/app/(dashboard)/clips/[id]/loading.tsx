export default function ClipDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 rounded bg-secondary" />
        <span className="text-muted-foreground">/</span>
        <div className="h-4 w-32 rounded bg-secondary" />
      </div>

      {/* Main content */}
      <div className="grid gap-8 lg:grid-cols-[1fr,400px]">
        {/* Left: Video player */}
        <div className="space-y-4">
          {/* Video */}
          <div className="aspect-video rounded-lg bg-secondary" />
          {/* Controls */}
          <div className="h-10 rounded-md bg-secondary" />
          {/* Tabs */}
          <div className="flex gap-4 border-b pb-2">
            <div className="h-4 w-16 rounded bg-secondary" />
            <div className="h-4 w-16 rounded bg-secondary" />
            <div className="h-4 w-12 rounded bg-secondary" />
            <div className="h-4 w-16 rounded bg-secondary" />
          </div>
          {/* Tab content */}
          <div className="space-y-3">
            <div className="h-4 w-24 rounded bg-secondary" />
            <div className="h-4 w-full rounded bg-secondary" />
            <div className="h-4 w-3/4 rounded bg-secondary" />
            <div className="h-4 w-1/2 rounded bg-secondary" />
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <div className="h-6 w-3/4 rounded bg-secondary" />
            <div className="mt-2 h-4 w-24 rounded bg-secondary" />
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 rounded-lg border bg-secondary/30" />
            <div className="h-24 rounded-lg border bg-secondary/30" />
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <div className="h-10 w-full rounded-md bg-secondary" />
            <div className="h-10 w-full rounded-md bg-secondary/60" />
            <div className="h-10 w-full rounded-md bg-secondary/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
