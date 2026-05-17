export default function FeaturesPage() {
  const features = [
    {
      title: "AI Clip Detection",
      description:
        "Our AI analyzes your video content to identify the most engaging, viral-worthy moments automatically.",
    },
    {
      title: "Auto Captions",
      description:
        "Generate beautiful animated captions with word-level timing. Multiple styles to match your brand.",
    },
    {
      title: "Multi-Platform Publishing",
      description:
        "Publish directly to YouTube Shorts, TikTok, and Instagram Reels with one click.",
    },
    {
      title: "Virality Scoring",
      description:
        "Each clip gets a virality score based on content analysis, pacing, and engagement patterns.",
    },
    {
      title: "Smart Thumbnails",
      description:
        "AI-generated thumbnails that capture the best frame and add attention-grabbing overlays.",
    },
    {
      title: "Team Collaboration",
      description:
        "Review clips together, leave comments, and approve content before it goes live.",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-center text-4xl font-bold">Features</h1>
      <p className="mt-4 text-center text-muted-foreground">
        Everything you need to repurpose long-form content into short-form gold.
      </p>
      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-lg border p-6">
            <h3 className="text-lg font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
