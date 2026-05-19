"use client";

import { useState } from "react";
import { isPlayableMediaUrl } from "@/lib/media/url";

export interface ClipDownloadButtonProps {
  /** The clip's own rendered file URL, when available. */
  clipStorageUrl: string | null;
  /**
   * The source video URL. Used as a fallback (with `#t=start,end`) when
   * the clip itself hasn't been rendered to its own file yet.
   */
  videoStorageUrl?: string | null;
  /** Clip start time in seconds within the source video (for fallback). */
  startTime: number;
  /** Clip end time in seconds within the source video (for fallback). */
  endTime: number;
  /** Used to build the suggested filename. */
  title: string;
  /** Visual variant. */
  variant?: "primary" | "secondary" | "icon";
  /** Override the inner label (only used for non-icon variants). */
  label?: string;
  className?: string;
}

function buildFilename(title: string): string {
  const safe = (title || "clip").replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 80);
  return `${safe || "clip"}.mp4`;
}

/**
 * Triggers a download for a single clip.
 *
 * - When the clip has been rendered to its own file (`clipStorageUrl`),
 *   the link points directly at that file with a `download` attribute so
 *   the browser saves it instead of navigating.
 * - Otherwise, when only the source video is available, the link uses a
 *   media-fragment URI (`#t=start,end`). Browsers cannot client-side trim
 *   a video, so this opens the source positioned at the clip's range. The
 *   user is informed via a tooltip that they will need to trim it.
 * - When neither URL is playable, the button is disabled with an
 *   explanatory tooltip rather than throwing an error.
 *
 * Implementation note: we render an `<a>` element (not a button) because
 * the browser's native `download` attribute only takes effect on anchor
 * elements with a same-origin or CORS-allowed URL. Falling back to
 * `window.open` would lose the suggested filename.
 */
export function ClipDownloadButton({
  clipStorageUrl,
  videoStorageUrl,
  startTime,
  endTime,
  title,
  variant = "secondary",
  label,
  className = "",
}: ClipDownloadButtonProps) {
  const [clicked, setClicked] = useState(false);

  const renderedUrl = isPlayableMediaUrl(clipStorageUrl) ? clipStorageUrl : null;
  const sourceUrl = isPlayableMediaUrl(videoStorageUrl) ? videoStorageUrl : null;

  // Prefer the rendered clip file. Otherwise fall back to the source
  // video with a media-fragment range so the user lands at the right spot.
  const href = renderedUrl
    ? renderedUrl
    : sourceUrl
      ? `${sourceUrl}#t=${startTime.toFixed(2)},${endTime.toFixed(2)}`
      : null;

  const isUntrimmedFallback = !renderedUrl && !!sourceUrl;
  const isDisabled = !href;

  const tooltip = isDisabled
    ? "Download will be available once the clip finishes rendering."
    : isUntrimmedFallback
      ? "Clip not yet rendered. This will download the source video positioned at the clip's start time — you'll need to trim it."
      : "Download this clip as MP4";

  const baseClasses = {
    primary:
      "inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50",
    secondary:
      "inline-flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50",
    icon: "inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background/80 backdrop-blur-sm transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50",
  }[variant];

  const icon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={variant === "icon" ? "h-4 w-4" : "h-4 w-4"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );

  const text = label ?? (isUntrimmedFallback ? "Download Source" : "Download Clip");

  if (isDisabled) {
    return (
      <button
        type="button"
        disabled
        title={tooltip}
        aria-label={text}
        className={`${baseClasses} ${className}`}
      >
        {icon}
        {variant !== "icon" && <span>{text}</span>}
      </button>
    );
  }

  // For an icon-only button inside a Link card, stop propagation so the
  // surrounding card link doesn't navigate when the user just wants to
  // download.
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    setClicked(true);
    // Reset the visual "clicked" state shortly so repeat downloads still
    // feel responsive.
    window.setTimeout(() => setClicked(false), 1500);
  };

  return (
    <a
      href={href}
      download={buildFilename(title)}
      // `noopener` is safe here because we don't open in a new tab; the
      // browser handles the download in-place when `download` succeeds.
      rel="noopener"
      onClick={handleClick}
      title={tooltip}
      aria-label={text}
      className={`${baseClasses} ${className}`}
    >
      {icon}
      {variant !== "icon" && (
        <span>{clicked ? "Starting download…" : text}</span>
      )}
    </a>
  );
}
