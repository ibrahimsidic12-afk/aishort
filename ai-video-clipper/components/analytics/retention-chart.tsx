"use client";

import type { RetentionData } from "@/types";

interface RetentionChartProps {
  data: RetentionData[];
  clipDuration: number;
}

export function RetentionChart({ data, clipDuration }: RetentionChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border text-sm text-muted-foreground">
        No retention data available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Audience Retention</h3>
      <div className="relative h-32 rounded-md border p-2">
        {/* SVG area chart placeholder */}
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            points={data
              .map((d) => `${(d.timestamp / clipDuration) * 100},${100 - d.percentage}`)
              .join(" ")}
          />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-muted-foreground">
          <span>0:00</span>
          <span>{Math.round(clipDuration)}s</span>
        </div>
      </div>
    </div>
  );
}
