"use client";

interface ChartProps {
  data: Array<{ label: string; value: number }>;
  title?: string;
}

export function BarChart({ data, title }: ChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      <div className="flex items-end gap-2" style={{ height: 120 }}>
        {data.map((item, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-primary"
              style={{ height: `${(item.value / max) * 100}%` }}
            />
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineChart({ data, title }: ChartProps) {
  // TODO: Replace with Recharts implementation
  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      <div className="flex h-32 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
        Line chart — {data.length} data points
      </div>
    </div>
  );
}
