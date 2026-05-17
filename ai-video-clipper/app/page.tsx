import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-primary">
            AI Video Clipper
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/features" className="text-sm hover:text-primary">
              Features
            </Link>
            <Link href="/pricing" className="text-sm hover:text-primary">
              Pricing
            </Link>
            <Link href="/blog" className="text-sm hover:text-primary">
              Blog
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            Turn Long Videos into
            <span className="text-primary"> Viral Shorts</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            AI-powered video clipping that identifies the best moments, adds
            captions, and publishes directly to YouTube Shorts, TikTok, and
            Instagram Reels.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start Free Trial
            </Link>
            <Link
              href="/docs"
              className="rounded-md border px-6 py-3 text-sm font-medium hover:bg-secondary"
            >
              Learn More
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AI Video Clipper. All rights reserved.</p>
      </footer>
    </div>
  );
}
