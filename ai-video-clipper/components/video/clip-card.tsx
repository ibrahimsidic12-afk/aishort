"use client";

import Link from "next/link";
import Image from "next/image";
import type { Clip } from "@/types";
import { ClipDownloadButton } from "@/components/clips/clip-download-button";

interface ClipCardProps {
  clip: Clip;
  selected?: boolean;
  onSelect?: (clipId: string) => void;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", dot: "bg-yellow-500" },
  GENERATING: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500 animate-pulse" },
  RENDERING: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500 animate-pulse" },
  READY: { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
  PUBLISHED: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  ERROR: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-blue-500";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return "stroke-green-500";
  if (score >= 60) return "stroke-blue-500";
  if (score >= 40) return "stroke-yellow-500";
  return "stroke-red-500";
}

export function ClipCard({ clip, selected, onSelect }: ClipCardProps) {
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `0:${s.toString().padStart(2, "0")}`;
  };

  const statusCfg = STATUS_CONFIG[clip.status] || STATUS_CONFIG.PENDING;

  // Stretched-link pattern: the card body is plain `<div>`s, and a single
  // absolutely-positioned `<Link>` covers the whole card to capture clicks.
  // Anything that needs its own click target (download, checkbox) sits at a
  // higher z-index and stops propagation. This keeps the download `<a>` from
  // becoming an invalid nested anchor inside the card link.
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
      {/* Card-wide click target */}
      <Link
        href={`/clips/${clip.id}`}
        aria-label={`Open clip ${clip.title}`}
        className="absolute inset-0 z-10"
      />

      {/* Selection checkbox */}
      {onSelect && (
        <div className="absolute left-3 top-3 z-20">
          <label className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border-2 border-white/60 bg-black/20 backdrop-blur-sm transition-all hover:border-white">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onSelect(clip.id)}
              className="sr-only"
              onClick={(e) => e.stopPropagation()}
            />
            {selected && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </label>
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative aspect-[9/16] overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        {clip.thumbnailUrl ? (
          <Image
            src={clip.thumbnailUrl}
            alt={clip.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground/60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" />
            </svg>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Duration badge */}
        <div className="absolute bottom-2.5 left-2.5 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          {formatDuration(clip.duration)}
        </div>

        {/* Score ring */}
        {clip.viralityScore != null && (
          <div className="absolute right-2.5 top-2.5 flex items-center justify-center">
            <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" className="stroke-white/20" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                className={getScoreRingColor(clip.viralityScore)}
                strokeWidth="3"
                strokeDasharray={`${(clip.viralityScore / 100) * 88} 88`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-white">
              {Math.round(clip.viralityScore)}
            </span>
          </div>
        )}

        {/* Play icon on hover */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="ml-0.5 h-5 w-5 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Download (z-20 so it sits above the card-wide Link overlay). */}
        <div className="absolute bottom-2.5 right-2.5 z-20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-within:opacity-100">
          <ClipDownloadButton
            clipStorageUrl={clip.storageUrl}
            startTime={clip.startTime}
            endTime={clip.endTime}
            title={clip.title}
            variant="icon"
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="truncate text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
          {clip.title}
        </h3>

        <div className="mt-2.5 flex items-center justify-between">
          {/* Score */}
          {clip.score != null && (
            <div className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 ${getScoreColor(clip.score)}`} viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
              <span className={`text-xs font-semibold tabular-nums ${getScoreColor(clip.score)}`}>
                {Math.round(clip.score)}
              </span>
            </div>
          )}

          {/* Status */}
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusCfg.bg} ${statusCfg.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
            {clip.status}
          </span>
        </div>

        {/* Tags */}
        {clip.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {clip.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground"
              >
                {tag}
              </span>
            ))}
            {clip.tags.length > 2 && (
              <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                +{clip.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
