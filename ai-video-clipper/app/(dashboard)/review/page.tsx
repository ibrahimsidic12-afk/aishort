export default function ReviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Review Queue</h1>
        <p className="text-muted-foreground">
          Review and approve clips before publishing.
        </p>
      </div>

      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          No clips pending review.
        </p>
      </div>
    </div>
  );
}
