export default function VideosPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Videos</h1>
        <p className="text-muted-foreground">
          Manage your uploaded videos and their clips.
        </p>
      </div>

      {/* Video List */}
      <div className="rounded-lg border">
        <div className="p-8 text-center">
          <p className="text-muted-foreground">
            No videos yet. Upload one to get started.
          </p>
        </div>
      </div>
    </div>
  );
}
