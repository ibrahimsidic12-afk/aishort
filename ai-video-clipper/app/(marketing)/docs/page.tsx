export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold">Documentation</h1>
      <p className="mt-4 text-muted-foreground">
        Learn how to get the most out of AI Video Clipper.
      </p>

      <div className="mt-12 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold">Quick Start</h2>
          <p className="mt-2 text-muted-foreground">
            Get up and running in under 5 minutes.
          </p>
          <ol className="mt-4 list-inside list-decimal space-y-2 text-sm">
            <li>Create an account or sign in</li>
            <li>Upload a video (up to 2 hours)</li>
            <li>Wait for AI analysis (2-5 minutes)</li>
            <li>Review generated clips</li>
            <li>Edit captions and thumbnails</li>
            <li>Publish to your platforms</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">API Reference</h2>
          <p className="mt-2 text-muted-foreground">
            Integrate video clipping into your own applications.
          </p>
          {/* TODO: Link to full API docs */}
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Guides</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>- Connecting YouTube</li>
            <li>- Connecting TikTok</li>
            <li>- Custom caption styles</li>
            <li>- Team workflows</li>
            <li>- Webhook integrations</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
