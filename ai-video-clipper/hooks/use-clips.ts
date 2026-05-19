"use client";

import { useState, useEffect, useCallback } from "react";
import type { Clip } from "@/types";

export function useClips(videoId?: string) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClips = useCallback(async () => {
    setLoading(true);
    try {
      const params = videoId ? `?videoId=${videoId}` : "";
      const res = await fetch(`/api/clips${params}`);
      const data = await res.json();
      setClips(data.clips ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch clips");
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchClips();
  }, [fetchClips]);

  const generateClips = async (videoId: string, preferences?: Record<string, unknown>) => {
    const res = await fetch("/api/clips/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, options: preferences }),
    });
    return res.json();
  };

  const deleteClip = async (clipId: string) => {
    await fetch(`/api/clips/delete?clipId=${clipId}`, {
      method: "DELETE",
    });
    setClips((prev) => prev.filter((c) => c.id !== clipId));
  };

  return { clips, loading, error, refetch: fetchClips, generateClips, deleteClip };
}
