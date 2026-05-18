export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome banner skeleton */}
      <div className="h-[180px] rounded-2xl shimmer" />

      {/* Stats grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5">
            <div className="h-10 w-10 rounded-lg shimmer" />
            <div className="mt-4 space-y-2">
              <div className="h-8 w-16 rounded-md shimmer" />
              <div className="h-4 w-24 rounded-md shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-6 lg:col-span-2">
          <div className="h-5 w-28 rounded-md shimmer" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-4 w-16 rounded shimmer" />
                  <div className="h-4 w-12 rounded shimmer" />
                </div>
                <div className="h-2 w-full rounded-full shimmer" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 lg:col-span-3">
          <div className="h-5 w-32 rounded-md shimmer" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg shimmer" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
