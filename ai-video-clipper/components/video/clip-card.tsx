import Link from "next/link";
import type { Clip } from "@/types";

interface ClipCardProps {
  clip: Clip;
}

export function ClipCard({ clip }: ClipCardProps) {
  return (
    <Link
      href={`/clips/${clip.id}`}
      className="group overflow-hidden rounded-lg border transition hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="aspect-[9/16] bg-muted">
        {clip.thumbnailUrl ? (
          <img
            src={clip.thumbnailUrl}
            alt={clip.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No Preview
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="truncate text-sm font-medium group-hover:text-primary">
          {clip.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{Math.round(clip.duration)}s</span>
          {clip.score && <span>Score: {Math.round(clip.score * 100)}%</span>}
          <span className="ml-auto capitalize">{clip.status.toLowerCase()}</span>
        </div>
      </div>
    </Link>
  );
}
