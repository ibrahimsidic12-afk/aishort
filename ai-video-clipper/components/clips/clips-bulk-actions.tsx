"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ClipsBulkActionsProps {
  clipIds: string[];
}

export function ClipsBulkActions({ clipIds }: ClipsBulkActionsProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const toggleAll = useCallback(() => {
    if (selected.size === clipIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(clipIds));
    }
  }, [clipIds, selected.size]);

  const handleBulkDelete = useCallback(async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} clip(s)? This cannot be undone.`)) return;

    setLoading(true);
    try {
      const deletePromises = Array.from(selected).map((clipId) =>
        fetch(`/api/clips/delete?clipId=${clipId}`, { method: "DELETE" })
      );
      await Promise.all(deletePromises);
      setSelected(new Set());
      router.refresh();
    } catch (error) {
      console.error("Bulk delete failed:", error);
    } finally {
      setLoading(false);
    }
  }, [selected, router]);

  if (clipIds.length === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-md border bg-secondary/30 px-4 py-2">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={selected.size === clipIds.length && clipIds.length > 0}
          onChange={toggleAll}
          className="h-4 w-4 rounded border-gray-300 accent-primary"
        />
        <span className="text-muted-foreground">
          {selected.size > 0 ? `${selected.size} selected` : "Select all"}
        </span>
      </label>

      {selected.size > 0 && (
        <>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={handleBulkDelete}
            disabled={loading}
            className="rounded-md border border-destructive/30 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            {loading ? "Deleting..." : `Delete (${selected.size})`}
          </button>
        </>
      )}
    </div>
  );
}
