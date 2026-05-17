"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <header className="flex h-14 items-center border-b px-6">
      <div className="flex flex-1 items-center gap-4">
        <input
          type="search"
          placeholder="Search videos, clips..."
          className="h-8 w-64 rounded-md border bg-secondary/50 px-3 text-sm"
        />
      </div>
      <div className="flex items-center gap-4">
        <Link href="/uploads" className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">
          Upload
        </Link>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
