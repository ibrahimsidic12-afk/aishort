import type { ClipPerformance } from "@/types";

interface ClipPerformanceListProps {
  clips: ClipPerformance[];
}

export function ClipPerformanceList({ clips }: ClipPerformanceListProps) {
  if (clips.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        No published clips with performance data yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {clips.map((clip) => (
        <div key={clip.clipId} className="flex items-center gap-4 rounded-md border p-3">
          <div className="flex-1">
            <p className="text-sm font-medium">{clip.title}</p>
            <p className="text-xs text-muted-foreground capitalize">{clip.platform}</p>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center text-xs">
            <div>
              <p className="font-medium">{clip.views}</p>
              <p className="text-muted-foreground">Views</p>
            </div>
            <div>
              <p className="font-medium">{clip.likes}</p>
              <p className="text-muted-foreground">Likes</p>
            </div>
            <div>
              <p className="font-medium">{clip.shares}</p>
              <p className="text-muted-foreground">Shares</p>
            </div>
            <div>
              <p className="font-medium">{Math.round(clip.retention * 100)}%</p>
              <p className="text-muted-foreground">Retention</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
