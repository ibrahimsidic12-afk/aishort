interface VideoDetailPageProps {
  params: { id: string };
}

export default function VideoDetailPage({ params }: VideoDetailPageProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Video Details</h1>
        <p className="text-muted-foreground">Video ID: {params.id}</p>
      </div>

      {/* Video Player */}
      <div className="aspect-video rounded-lg border bg-muted">
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Video Player</p>
        </div>
      </div>

      {/* Clips from this video */}
      <div>
        <h2 className="text-lg font-semibold">Generated Clips</h2>
        <p className="mt-4 text-sm text-muted-foreground">
          No clips generated yet for this video.
        </p>
      </div>
    </div>
  );
}
