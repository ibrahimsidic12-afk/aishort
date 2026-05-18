export default function ClipsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-28 rounded-lg shimmer" />
          <div className="mt-2 h-4 w-40 rounded-md shimmer" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-9 w-[220px] rounded-lg shimmer" />
        <div className="h-9 w-[130px] rounded-lg shimmer" />
        <div className="h-9 w-[140px] rounded-lg shimmer" />
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border bg-card"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {/* Thumbnail skeleton */}
            <div className="aspect-[9/16] shimmer" />
            {/* Info skeleton */}
            <div className="space-y-2.5 p-3.5">
              <div className="h-4 w-3/4 rounded-md shimmer" />
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-10 rounded-md shimmer" />
                <div className="h-5 w-16 rounded-full shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
