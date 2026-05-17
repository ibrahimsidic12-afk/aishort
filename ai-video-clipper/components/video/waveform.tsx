"use client";

interface WaveformProps {
  data?: number[];
  currentTime?: number;
  duration?: number;
  height?: number;
}

export function Waveform({
  data = [],
  currentTime = 0,
  duration = 1,
  height = 48,
}: WaveformProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Generate placeholder bars if no data
  const bars = data.length > 0 ? data : Array.from({ length: 50 }, () => Math.random());

  return (
    <div className="relative overflow-hidden rounded" style={{ height }}>
      <div className="flex h-full items-end gap-px">
        {bars.map((value, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-primary/30"
            style={{ height: `${value * 100}%` }}
          />
        ))}
      </div>
      {/* Progress overlay */}
      <div
        className="absolute inset-y-0 left-0 bg-primary/20"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
