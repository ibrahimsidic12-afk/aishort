export default function ClipDetailLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-16 rounded shimmer" />
        <span className="text-muted-foreground/30">/</span>
        <div className="h-4 w-32 rounded shimmer" />
      </div>

      {/* Main content */}
      <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
        {/* Left: Video player */}
        <div className="space-y-4">
          <div className="aspect-video rounded-xl shimmer" />
          <div className="h-10 rounded-lg shimmer" />
          {/* Tabs */}
          <div className="flex gap-4 border-b pb-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-16 rounded shimmer" />
            ))}
          </div>
          {/* Tab content */}
          <div className="space-y-3 pt-2">
            <div className="h-4 w-20 rounded shimmer" />
            <div className="h-4 w-full rounded shimmer" />
            <div className="h-4 w-3/4 rounded shimmer" />
            <div className="h-4 w-1/2 rounded shimmer" />
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          <div>
            <div className="h-6 w-3/4 rounded shimmer" />
            <div className="mt-2 h-4 w-20 rounded shimmer" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-[100px] rounded-xl border shimmer" />
            <div className="h-[100px] rounded-xl border shimmer" />
          </div>
          <div className="space-y-2">
            <div className="h-11 w-full rounded-lg shimmer" />
            <div className="h-11 w-full rounded-lg shimmer opacity-70" />
            <div className="h-11 w-full rounded-lg shimmer opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
