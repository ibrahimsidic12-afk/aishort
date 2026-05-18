export default function ClipsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div>
        <div className="h-9 w-32 rounded bg-secondary" />
        <div className="mt-2 h-4 w-48 rounded bg-secondary" />
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="h-9 w-[200px] rounded-md bg-secondary" />
        <div className="h-9 w-[140px] rounded-md bg-secondary" />
        <div className="h-9 w-[140px] rounded-md bg-secondary" />
      </div>

      {/* Bulk actions skeleton */}
      <div className="h-10 w-full rounded-md bg-secondary/30" />

      {/* Grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ClipCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function ClipCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border">
      {/* Thumbnail skeleton */}
      <div className="aspect-[9/16] bg-secondary" />
      {/* Info skeleton */}
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 rounded bg-secondary" />
        <div className="flex items-center justify-between">
          <div className="h-3 w-12 rounded bg-secondary" />
          <div className="h-4 w-16 rounded-full bg-secondary" />
        </div>
      </div>
    </div>
  );
}
