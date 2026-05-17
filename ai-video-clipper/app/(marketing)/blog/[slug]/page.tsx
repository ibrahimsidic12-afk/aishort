import { notFound } from "next/navigation";

interface BlogPostPageProps {
  params: { slug: string };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  // TODO: Fetch blog post from CMS or MDX
  const { slug } = params;

  if (!slug) {
    notFound();
  }

  return (
    <article className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold capitalize">
        {slug.replace(/-/g, " ")}
      </h1>
      <p className="mt-4 text-muted-foreground">
        Blog post content will be loaded here. This is a placeholder for the
        &ldquo;{slug}&rdquo; post.
      </p>
      <div className="prose mt-8">
        {/* TODO: Render MDX or CMS content */}
        <p>Content coming soon...</p>
      </div>
    </article>
  );
}
