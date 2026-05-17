"use client";

import { useState } from "react";

interface TimelineEditorProps {
  duration: number;
  startTime: number;
  endTime: number;
  onRangeChange: (start: number, end: number) => void;
  segments?: Array<{ start: number; end: number; label?: string }>;
}

export function TimelineEditor({
  duration,
  startTime,
  endTime,
  onRangeChange,
  segments = [],
}: TimelineEditorProps) {
  const [dragging, setDragging] = useState<"start" | "end" | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2">
      <div className="relative h-12 rounded-md bg-muted">
        {/* Segments */}
        {segments.map((seg, i) => (
          <div
            key={i}
            className="absolute top-0 h-full bg-primary/20"
            style={{
              left: `${(seg.start / duration) * 100}%`,
              width: `${((seg.end - seg.start) / duration) * 100}%`,
            }}
          />
        ))}

        {/* Selection range */}
        <div
          className="absolute top-0 h-full bg-primary/40 border-x-2 border-primary"
          style={{
            left: `${(startTime / duration) * 100}%`,
            width: `${((endTime - startTime) / duration) * 100}%`,
          }}
        />
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatTime(startTime)}</span>
        <span>{formatTime(endTime - startTime)} selected</span>
        <span>{formatTime(endTime)}</span>
      </div>
    </div>
  );
}
