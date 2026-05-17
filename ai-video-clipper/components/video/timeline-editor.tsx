"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface TimelineEditorProps {
  duration: number;
  startTime: number;
  endTime: number;
  currentTime?: number;
  onRangeChange: (start: number, end: number) => void;
  segments?: Array<{ start: number; end: number; label?: string; color?: string }>;
  minClipDuration?: number;
  maxClipDuration?: number;
}

export function TimelineEditor({
  duration,
  startTime,
  endTime,
  currentTime = 0,
  onRangeChange,
  segments = [],
  minClipDuration = 5,
  maxClipDuration = 180,
}: TimelineEditorProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"start" | "end" | "range" | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValues, setDragStartValues] = useState({ start: 0, end: 0 });

  const timeToPercent = (time: number) => (time / duration) * 100;
  const percentToTime = (percent: number) => (percent / 100) * duration;

  const getTimeFromMouseEvent = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      return percentToTime(percent);
    },
    [duration],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: "start" | "end" | "range") => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(type);
      setDragStartX(e.clientX);
      setDragStartValues({ start: startTime, end: endTime });
    },
    [startTime, endTime],
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const time = getTimeFromMouseEvent(e);

      if (dragging === "start") {
        const newStart = Math.max(0, Math.min(time, endTime - minClipDuration));
        const clampedStart = endTime - newStart > maxClipDuration
          ? endTime - maxClipDuration
          : newStart;
        onRangeChange(Math.max(0, clampedStart), endTime);
      } else if (dragging === "end") {
        const newEnd = Math.min(duration, Math.max(time, startTime + minClipDuration));
        const clampedEnd = newEnd - startTime > maxClipDuration
          ? startTime + maxClipDuration
          : newEnd;
        onRangeChange(startTime, Math.min(duration, clampedEnd));
      } else if (dragging === "range") {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const deltaX = e.clientX - dragStartX;
        const deltaTime = (deltaX / rect.width) * duration;
        const rangeDuration = dragStartValues.end - dragStartValues.start;

        let newStart = dragStartValues.start + deltaTime;
        let newEnd = dragStartValues.end + deltaTime;

        if (newStart < 0) {
          newStart = 0;
          newEnd = rangeDuration;
        }
        if (newEnd > duration) {
          newEnd = duration;
          newStart = duration - rangeDuration;
        }

        onRangeChange(newStart, newEnd);
      }
    };

    const handleMouseUp = () => setDragging(null);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, dragStartX, dragStartValues, startTime, endTime, duration, getTimeFromMouseEvent, onRangeChange, minClipDuration, maxClipDuration]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const clipDuration = endTime - startTime;

  return (
    <div className="space-y-2 select-none">
      {/* Time labels */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatTime(startTime)}</span>
        <span className="font-medium text-foreground">
          {formatTime(clipDuration)} selected
        </span>
        <span>{formatTime(endTime)}</span>
      </div>

      {/* Timeline track */}
      <div
        ref={trackRef}
        className="relative h-14 rounded-md bg-muted cursor-crosshair"
        onClick={(e) => {
          if (!dragging) {
            const time = getTimeFromMouseEvent(e);
            // Click to move playhead (or could center range)
          }
        }}
      >
        {/* Segment indicators (scored regions from AI) */}
        {segments.map((seg, i) => (
          <div
            key={i}
            className="absolute top-0 h-full rounded-sm opacity-30"
            style={{
              left: `${timeToPercent(seg.start)}%`,
              width: `${timeToPercent(seg.end - seg.start)}%`,
              backgroundColor: seg.color || "hsl(var(--primary))",
            }}
            title={seg.label || `Segment ${i + 1}`}
          />
        ))}

        {/* Selected range */}
        <div
          className="absolute top-0 h-full cursor-grab rounded-sm bg-primary/30 active:cursor-grabbing"
          style={{
            left: `${timeToPercent(startTime)}%`,
            width: `${timeToPercent(clipDuration)}%`,
          }}
          onMouseDown={(e) => handleMouseDown(e, "range")}
        />

        {/* Start handle */}
        <div
          className="absolute top-0 h-full w-2 cursor-col-resize bg-primary rounded-l-sm hover:bg-primary/80 transition"
          style={{ left: `${timeToPercent(startTime)}%` }}
          onMouseDown={(e) => handleMouseDown(e, "start")}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-0.5 bg-white rounded-full" />
        </div>

        {/* End handle */}
        <div
          className="absolute top-0 h-full w-2 cursor-col-resize bg-primary rounded-r-sm hover:bg-primary/80 transition"
          style={{ left: `calc(${timeToPercent(endTime)}% - 8px)` }}
          onMouseDown={(e) => handleMouseDown(e, "end")}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-0.5 bg-white rounded-full" />
        </div>

        {/* Playhead */}
        {currentTime >= startTime && currentTime <= endTime && (
          <div
            className="absolute top-0 h-full w-0.5 bg-red-500 pointer-events-none z-10"
            style={{ left: `${timeToPercent(currentTime)}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-red-500" />
          </div>
        )}
      </div>

      {/* Duration info */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>0:00</span>
        <div className="flex gap-3">
          {clipDuration < minClipDuration && (
            <span className="text-destructive">
              Too short (min {minClipDuration}s)
            </span>
          )}
          {clipDuration > maxClipDuration && (
            <span className="text-destructive">
              Too long (max {maxClipDuration}s)
            </span>
          )}
        </div>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
