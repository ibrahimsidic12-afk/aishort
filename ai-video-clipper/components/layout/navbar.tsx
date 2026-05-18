"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { UserButton } from "@clerk/nextjs";

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  uploads: "Upload",
  videos: "Videos",
  clips: "Clips",
  review: "Review",
  analytics: "Analytics",
  team: "Team",
  settings: "Settings",
};

export function Navbar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // Generate breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: BREADCRUMB_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 100);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-xl">
      {/* Breadcrumbs */}
      <nav className="hidden items-center gap-1.5 text-sm md:flex">
        <Link
          href="/dashboard"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </Link>
        {breadcrumbs.map((crumb) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
            {crumb.isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-muted-foreground transition-colors hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative">
        {searchOpen ? (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 animate-scale-in">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos, clips..."
                className="h-9 w-[280px] rounded-lg border bg-background pl-9 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                onBlur={() => {
                  if (!searchQuery) setSearchOpen(false);
                }}
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setSearchOpen(true);
              setTimeout(() => searchRef.current?.focus(), 100);
            }}
            className="flex h-9 items-center gap-2 rounded-lg border bg-secondary/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <span className="hidden lg:inline">Search...</span>
            <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium lg:inline-block">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* Notifications */}
      <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {/* Notification dot */}
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
      </button>

      {/* Upload CTA */}
      <Link
        href="/uploads"
        className="hidden items-center gap-1.5 rounded-lg gradient-bg px-3.5 py-2 text-xs font-medium text-white shadow-glow transition-all hover:shadow-glow-lg hover:brightness-110 sm:flex"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14" /><path d="M5 12h14" />
        </svg>
        Upload
      </Link>

      {/* User */}
      <div className="flex items-center">
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "h-8 w-8 rounded-lg ring-2 ring-border",
            },
          }}
        />
      </div>
    </header>
  );
}
