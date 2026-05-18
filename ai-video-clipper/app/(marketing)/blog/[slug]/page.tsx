export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <article className="prose dark:prose-invert">
        <h1 className="text-4xl font-bold">{slug.replace(/-/g, " ")}</h1>
        <p className="mt-4 text-muted-foreground">
          Blog content coming soon.
        </p>
      </article>
    </div>
  );
}
