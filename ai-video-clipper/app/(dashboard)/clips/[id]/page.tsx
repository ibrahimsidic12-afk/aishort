interface ClipDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClipDetailPage({ params }: ClipDetailPageProps) {
  const { id } = await params;
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Clip Details</h1>
        <p className="text-muted-foreground">Clip ID: {id}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Clip Preview */}
        <div className="aspect-[9/16] rounded-lg border bg-muted">
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Clip Preview</p>
          </div>
        </div>

        {/* Clip Details */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Title</h2>
            <p className="text-muted-foreground">Clip title placeholder</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Scores</h2>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Quality</p>
                <p className="text-lg font-bold">—</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">Virality</p>
                <p className="text-lg font-bold">—</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
              Publish
            </button>
            <button className="rounded-md border px-4 py-2 text-sm">
              Edit
            </button>
            <button className="rounded-md border px-4 py-2 text-sm text-destructive">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
