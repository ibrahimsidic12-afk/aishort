"use client";

import Link from "next/link";
import Image from "next/image";
import type { Clip } from "@/types";

interface ClipCardProps {
  clip: Clip;
  selected?: boolean;
  onSelect?: (clipId: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  GENERATING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  RENDERING: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  READY: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  PUBLISHED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  ERROR: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 40) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

export function ClipCard({ clip, selected, onSelect }: ClipCardProps) {
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border transition hover:shadow-md">
      {/* Selection checkbox */}
      {onSelect && (
        <div className="absolute left-2 top-2 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(clip.id)}
            className="h-4 w-4 rounded border-gray-300 accent-primary"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Link href={`/clips/${clip.id}`}>
        {/* Thumbnail */}
        <div className="relative aspect-[9/16] bg-muted">
          {clip.thumbnailUrl ? (
            <Image
              src={clip.thumbnailUrl}
              alt={clip.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="text-xs">No Preview</span>
            </div>
          )}

          {/* Duration overlay */}
          <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
            {formatDuration(clip.duration)}
          </div>

          {/* Virality score overlay */}
          {clip.viralityScore != null && (
            <div className="absolute right-2 top-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              {Math.round(clip.viralityScore)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="truncate text-sm font-medium group-hover:text-primary">
            {clip.title}
          </h3>

          <div className="mt-2 flex items-center justify-between">
            {/* Score */}
            {clip.score != null && (
              <span className={`text-xs font-semibold ${getScoreColor(clip.score)}`}>
                {Math.round(clip.score)}/100
              </span>
            )}

            {/* Status badge */}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                STATUS_STYLES[clip.status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {clip.status}
            </span>
          </div>

          {/* Tags */}
          {clip.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {clip.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {clip.tags.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{clip.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
