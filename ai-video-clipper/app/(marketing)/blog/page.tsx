import Link from "next/link";

export default function BlogPage() {
  const posts = [
    {
      slug: "getting-started",
      title: "Getting Started with AI Video Clipper",
      excerpt: "Learn how to upload your first video and generate clips in minutes.",
      date: "2024-03-15",
    },
    {
      slug: "viral-shorts-tips",
      title: "5 Tips for Creating Viral Short-Form Content",
      excerpt: "Discover what makes short videos go viral and how to optimize your clips.",
      date: "2024-03-10",
    },
    {
      slug: "caption-styles",
      title: "The Best Caption Styles for Engagement",
      excerpt: "A deep dive into caption styles that boost viewer retention.",
      date: "2024-03-05",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold">Blog</h1>
      <p className="mt-2 text-muted-foreground">
        Tips, guides, and insights for video creators.
      </p>
      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group rounded-lg border p-6 transition hover:shadow-md"
          >
            <time className="text-xs text-muted-foreground">{post.date}</time>
            <h2 className="mt-2 text-lg font-semibold group-hover:text-primary">
              {post.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
