"use client";

interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

interface ClipCaptionPreviewProps {
  segments: CaptionSegment[];
  duration: number;
}

export function ClipCaptionPreview({ segments, duration }: ClipCaptionPreviewProps) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <p className="mt-3 text-sm font-medium">No captions available</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Captions will appear here once the video is transcribed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline visualization */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>0:00</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="relative h-6 rounded bg-secondary">
          {segments.map((seg, i) => {
            const left = (seg.start / duration) * 100;
            const width = ((seg.end - seg.start) / duration) * 100;
            return (
              <div
                key={i}
                className="absolute top-0 h-full rounded bg-primary/60 hover:bg-primary/80 transition"
                style={{ left: `${left}%`, width: `${Math.max(1, width)}%` }}
                title={seg.text}
              />
            );
          })}
        </div>
      </div>

      {/* Caption list */}
      <div className="max-h-[400px] space-y-1 overflow-y-auto rounded-lg border p-3">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-md p-2 text-sm hover:bg-secondary/50 transition"
          >
            <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {formatTime(seg.start)}
            </span>
            <p className="flex-1 leading-relaxed">{seg.text}</p>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              {Math.round(seg.end - seg.start)}s
            </span>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {segments.length} caption segment{segments.length !== 1 ? "s" : ""} &middot; Total duration: {formatTime(duration)}
      </p>
    </div>
  );
}
