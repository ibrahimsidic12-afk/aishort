"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GenerateClipsButtonProps {
  videoId: string;
  maxClips?: number;
}

export function GenerateClipsButton({ videoId, maxClips = 10 }: GenerateClipsButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/clips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          options: {
            maxClips,
            minDuration: 15,
            maxDuration: 60,
            style: "engaging",
            aspectRatio: "9:16",
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate clips");
      }

      setSuccess(true);
      setTimeout(() => router.refresh(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-center dark:border-green-900/30 dark:bg-green-900/10">
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          Generating {maxClips} clips... This may take a minute.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full rounded-lg gradient-bg px-4 py-3 text-sm font-medium text-white shadow-glow transition-all hover:shadow-glow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating...
          </span>
        ) : (
          `Generate ${maxClips} AI Clips`
        )}
      </button>
      {error && (
        <p className="text-center text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
