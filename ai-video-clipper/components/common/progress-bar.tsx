interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  value,
  label,
  showPercentage = true,
  size = "md",
}: ProgressBarProps) {
  const heights = { sm: "h-1", md: "h-2", lg: "h-3" };

  return (
    <div className="space-y-1">
      {(label || showPercentage) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {label && <span>{label}</span>}
          {showPercentage && <span>{Math.round(value)}%</span>}
        </div>
      )}
      <div className={`overflow-hidden rounded-full bg-muted ${heights[size]}`}>
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
