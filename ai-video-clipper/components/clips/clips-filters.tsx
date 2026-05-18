"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

interface ClipsFiltersProps {
  currentStatus: string;
  currentSort: string;
  currentSearch: string;
}

export function ClipsFilters({ currentStatus, currentSort, currentSearch }: ClipsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all" && value !== "score") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 on filter change
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateParams("search", search);
    },
    [search, updateParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clips..."
          className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </form>

      {/* Status filter */}
      <select
        value={currentStatus}
        onChange={(e) => updateParams("status", e.target.value)}
        className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="generating">Generating</option>
        <option value="rendering">Rendering</option>
        <option value="ready">Ready</option>
        <option value="published">Published</option>
        <option value="error">Error</option>
      </select>

      {/* Sort */}
      <select
        value={currentSort}
        onChange={(e) => updateParams("sort", e.target.value)}
        className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="score">Sort by Score</option>
        <option value="virality">Sort by Virality</option>
        <option value="date">Sort by Date</option>
        <option value="duration">Sort by Duration</option>
      </select>

      {/* Clear filters */}
      {(currentStatus !== "all" || currentSort !== "score" || currentSearch) && (
        <button
          onClick={() => router.push(pathname)}
          className="rounded-md border px-3 py-2 text-xs text-muted-foreground hover:bg-secondary"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
