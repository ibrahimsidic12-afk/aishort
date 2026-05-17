import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-card py-12">
      <div className="container mx-auto grid gap-8 px-4 md:grid-cols-4">
        <div>
          <h3 className="font-bold">AI Video Clipper</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Turn long videos into viral shorts with AI.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Product</h4>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/features">Features</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/docs">Documentation</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li><Link href="/blog">Blog</Link></li>
            <li><a href="#">Twitter</a></li>
            <li><a href="#">GitHub</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Legal</h4>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
