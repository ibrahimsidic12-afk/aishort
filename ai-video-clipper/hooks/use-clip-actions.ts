"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UseClipActionsOptions {
  onSuccess?: (action: string) => void;
  onError?: (action: string, error: string) => void;
}

export function useClipActions(options?: UseClipActionsOptions) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deleteClip = useCallback(
    async (clipId: string, confirm = true) => {
      if (confirm && !window.confirm("Delete this clip? This cannot be undone.")) return false;

      setLoading("delete");
      setError(null);

      try {
        const res = await fetch(`/api/clips/delete?clipId=${clipId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to delete clip");
        }

        options?.onSuccess?.("delete");
        router.refresh();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete";
        setError(message);
        options?.onError?.("delete", message);
        return false;
      } finally {
        setLoading(null);
      }
    },
    [router, options]
  );

  const publishClip = useCallback(
    async (clipId: string, platform: string, metadata?: { title?: string; description?: string; tags?: string[] }) => {
      setLoading(`publish-${platform}`);
      setError(null);

      try {
        const res = await fetch("/api/clips/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clipId, platform, metadata }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to publish clip");
        }

        const data = await res.json();
        options?.onSuccess?.(`publish-${platform}`);
        router.refresh();
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to publish";
        setError(message);
        options?.onError?.(`publish-${platform}`, message);
        return null;
      } finally {
        setLoading(null);
      }
    },
    [router, options]
  );

  const downloadClip = useCallback(
    async (clipId: string, storageUrl: string | null, title: string) => {
      if (!storageUrl) {
        setError("Clip has not been rendered yet. No file available for download.");
        return false;
      }

      setLoading("download");
      setError(null);

      try {
        const response = await fetch(storageUrl);
        if (!response.ok) throw new Error("Failed to fetch clip file");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        options?.onSuccess?.("download");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Download failed";
        setError(message);
        options?.onError?.("download", message);
        return false;
      } finally {
        setLoading(null);
      }
    },
    [options]
  );

  const regenerateClip = useCallback(
    async (videoId: string, clipIds: string[]) => {
      setLoading("regenerate");
      setError(null);

      try {
        const res = await fetch("/api/clips/regenerate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, previousClipIds: clipIds }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to regenerate clips");
        }

        const data = await res.json();
        options?.onSuccess?.("regenerate");
        router.refresh();
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Regeneration failed";
        setError(message);
        options?.onError?.("regenerate", message);
        return null;
      } finally {
        setLoading(null);
      }
    },
    [router, options]
  );

  const bulkDelete = useCallback(
    async (clipIds: string[]) => {
      if (clipIds.length === 0) return false;
      if (!window.confirm(`Delete ${clipIds.length} clip(s)? This cannot be undone.`)) return false;

      setLoading("bulk-delete");
      setError(null);

      try {
        const results = await Promise.allSettled(
          clipIds.map((id) =>
            fetch(`/api/clips/delete?clipId=${id}`, { method: "DELETE" })
          )
        );

        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          setError(`${failed} of ${clipIds.length} deletions failed.`);
        }

        options?.onSuccess?.("bulk-delete");
        router.refresh();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Bulk delete failed";
        setError(message);
        options?.onError?.("bulk-delete", message);
        return false;
      } finally {
        setLoading(null);
      }
    },
    [router, options]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    loading,
    error,
    clearError,
    deleteClip,
    publishClip,
    downloadClip,
    regenerateClip,
    bulkDelete,
    isLoading: loading !== null,
  };
}
