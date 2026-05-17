"use client";

import type { CaptionStyle, CaptionSegment } from "@/types";

interface CaptionPreviewProps {
  segments: CaptionSegment[];
  currentTime: number;
  style: CaptionStyle;
}

export function CaptionPreview({
  segments,
  currentTime,
  style,
}: CaptionPreviewProps) {
  const activeSegment = segments.find(
    (seg) => currentTime >= seg.start && currentTime <= seg.end,
  );

  if (!activeSegment) return null;

  const positionClass = {
    top: "top-4",
    center: "top-1/2 -translate-y-1/2",
    bottom: "bottom-4",
  }[style.position];

  return (
    <div className={`absolute left-0 right-0 ${positionClass} text-center`}>
      <span
        className="inline-block rounded px-3 py-1 text-lg font-bold"
        style={{
          fontFamily: style.fontFamily,
          fontSize: `${style.fontSize}px`,
          color: style.fontColor,
          backgroundColor: style.backgroundColor,
        }}
      >
        {activeSegment.text}
      </span>
    </div>
  );
}
