export default function UploadsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Upload Video</h1>
          <p className="text-muted-foreground">
            Upload a video to start generating clips.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12">
        <p className="text-lg font-medium">Drop your video here</p>
        <p className="mt-2 text-sm text-muted-foreground">
          MP4, MOV, WEBM up to 2GB
        </p>
        <button className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
          Browse Files
        </button>
      </div>

      {/* Upload History */}
      <div>
        <h2 className="text-lg font-semibold">Recent Uploads</h2>
        <p className="mt-4 text-sm text-muted-foreground">
          No uploads yet.
        </p>
      </div>
    </div>
  );
}
