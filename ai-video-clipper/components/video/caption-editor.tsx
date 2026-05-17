"use client";

import { useState, useCallback } from "react";
import type { CaptionData, CaptionSegment, CaptionStyle } from "@/types";

interface CaptionEditorProps {
  initialCaptions: CaptionData;
  onSave: (captions: CaptionData) => void;
  currentTime?: number;
}

const STYLES: { label: string; value: CaptionStyle }[] = [
  {
    label: "Classic White",
    value: {
      fontFamily: "Arial",
      fontSize: 64,
      fontColor: "#FFFFFF",
      backgroundColor: "rgba(0,0,0,0.6)",
      position: "bottom",
      animation: "none",
    },
  },
  {
    label: "Bold Pop",
    value: {
      fontFamily: "Impact",
      fontSize: 72,
      fontColor: "#FFFFFF",
      backgroundColor: "transparent",
      position: "center",
      animation: "pop",
    },
  },
  {
    label: "Highlight",
    value: {
      fontFamily: "Inter",
      fontSize: 56,
      fontColor: "#000000",
      backgroundColor: "#FFFF00",
      position: "bottom",
      animation: "highlight",
    },
  },
  {
    label: "Fade Minimal",
    value: {
      fontFamily: "Inter",
      fontSize: 48,
      fontColor: "#FFFFFF",
      backgroundColor: "transparent",
      position: "bottom",
      animation: "fade",
    },
  },
];

export function CaptionEditor({
  initialCaptions,
  onSave,
  currentTime = 0,
}: CaptionEditorProps) {
  const [segments, setSegments] = useState<CaptionSegment[]>(
    initialCaptions.segments,
  );
  const [style, setStyle] = useState<CaptionStyle>(initialCaptions.style);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const activeSegmentIndex = segments.findIndex(
    (seg) => currentTime >= seg.start && currentTime <= seg.end,
  );

  const updateSegment = useCallback(
    (index: number, updates: Partial<CaptionSegment>) => {
      setSegments((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...updates };
        return updated;
      });
      setHasChanges(true);
    },
    [],
  );

  const addSegment = useCallback(() => {
    const lastEnd = segments.length > 0 ? segments[segments.length - 1].end : 0;
    setSegments((prev) => [
      ...prev,
      { start: lastEnd, end: lastEnd + 3, text: "New caption" },
    ]);
    setEditingIndex(segments.length);
    setHasChanges(true);
  }, [segments]);

  const removeSegment = useCallback((index: number) => {
    setSegments((prev) => prev.filter((_, i) => i !== index));
    setEditingIndex(null);
    setHasChanges(true);
  }, []);

  const handleSave = () => {
    onSave({ segments, style });
    setHasChanges(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
  };

  return (
    <div className="space-y-6">
      {/* Style Picker */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Caption Style</h3>
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                setStyle(s.value);
                setHasChanges(true);
              }}
              className={`rounded-md border p-3 text-left text-xs transition ${
                style.fontFamily === s.value.fontFamily &&
                style.animation === s.value.animation
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
            >
              <span
                className="block text-base font-bold"
                style={{
                  fontFamily: s.value.fontFamily,
                  color: s.value.fontColor === "#000000" ? "inherit" : undefined,
                }}
              >
                {s.label}
              </span>
              <span className="text-muted-foreground capitalize">
                {s.value.animation} · {s.value.position}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Position */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Position</h3>
        <div className="flex gap-2">
          {(["top", "center", "bottom"] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => {
                setStyle((s) => ({ ...s, position: pos }));
                setHasChanges(true);
              }}
              className={`rounded-md border px-3 py-1.5 text-xs capitalize ${
                style.position === pos
                  ? "border-primary bg-primary/10 text-primary"
                  : ""
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* Caption Segments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">
            Segments ({segments.length})
          </h3>
          <button
            onClick={addSegment}
            className="rounded-md border px-2 py-1 text-xs hover:bg-secondary"
          >
            + Add
          </button>
        </div>

        <div className="max-h-[300px] space-y-1 overflow-y-auto">
          {segments.map((seg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-md border p-2 transition ${
                i === activeSegmentIndex
                  ? "border-primary bg-primary/5"
                  : editingIndex === i
                    ? "border-blue-400 bg-blue-50/50"
                    : "hover:bg-secondary/50"
              }`}
              onClick={() => setEditingIndex(i)}
            >
              <div className="shrink-0 text-[10px] text-muted-foreground font-mono pt-1">
                {formatTime(seg.start)}
                <br />
                {formatTime(seg.end)}
              </div>

              {editingIndex === i ? (
                <div className="flex-1 space-y-2">
                  <textarea
                    value={seg.text}
                    onChange={(e) => updateSegment(i, { text: e.target.value })}
                    className="w-full rounded border bg-background px-2 py-1 text-sm resize-none"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={seg.start.toFixed(1)}
                      onChange={(e) =>
                        updateSegment(i, { start: parseFloat(e.target.value) || 0 })
                      }
                      className="w-16 rounded border px-2 py-0.5 text-xs"
                      step="0.1"
                    />
                    <span className="text-xs text-muted-foreground">→</span>
                    <input
                      type="number"
                      value={seg.end.toFixed(1)}
                      onChange={(e) =>
                        updateSegment(i, { end: parseFloat(e.target.value) || 0 })
                      }
                      className="w-16 rounded border px-2 py-0.5 text-xs"
                      step="0.1"
                    />
                    <button
                      onClick={() => removeSegment(i)}
                      className="ml-auto text-xs text-destructive hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <p className="flex-1 text-sm truncate">{seg.text}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!hasChanges}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {hasChanges ? "Save Captions" : "Saved"}
      </button>
    </div>
  );
}
