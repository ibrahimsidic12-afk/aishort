import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <section className="text-center">
        <h1 className="text-5xl font-bold tracking-tight">
          AI-Powered Video Clipping
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Upload your long-form content and let AI find the viral moments.
          Auto-generate captions, thumbnails, and publish everywhere.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="rounded-md border px-6 py-3 text-sm font-medium"
          >
            Sign In
          </Link>
        </div>
      </section>
    </div>
  );
}