export default function ClipsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Clips</h1>
        <p className="text-muted-foreground">
          View and manage all your generated clips.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select className="rounded-md border px-3 py-2 text-sm">
          <option>All Status</option>
          <option>Ready</option>
          <option>Published</option>
          <option>Pending</option>
        </select>
        <select className="rounded-md border px-3 py-2 text-sm">
          <option>Sort by Score</option>
          <option>Sort by Date</option>
          <option>Sort by Duration</option>
        </select>
      </div>

      {/* Clip Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">No clips yet.</p>
        </div>
      </div>
    </div>
  );
}
