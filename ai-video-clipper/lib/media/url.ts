/**
 * Helpers for inspecting media URLs before handing them to a `<video>` element.
 *
 * The HTML5 `<video>` element only knows how to decode direct media files
 * (mp4, webm, mov, m3u8, etc.). Embedding a YouTube/Vimeo page URL — or any
 * non-media URL — produces a `NotSupportedError` ("The element has no
 * supported sources") that surfaces as an unhandled promise rejection from
 * the auto-`play()` call. These helpers let us guard the player UI so we can
 * show a fallback instead of crashing.
 */

const PLAYABLE_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
  ".ogg",
  ".ogv",
  ".m3u8", // HLS manifest
  ".mpd",  // DASH manifest
];

const NON_PLAYABLE_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com",
];

/**
 * Returns true when the URL points at a media file the browser's `<video>`
 * element can attempt to decode. Returns false for empty values, non-http
 * schemes, and known third-party page URLs (YouTube/Vimeo).
 *
 * Note: this is a best-effort check. A "true" result still does not
 * guarantee the codec is supported — listen to the element's `error` event
 * for the authoritative answer at runtime.
 */
export function isPlayableMediaUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;

  const trimmed = url.trim();
  if (trimmed.length === 0) return false;

  // Allow blob: and data: media URLs (used for client-side previews).
  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:video/")) {
    return true;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  if (NON_PLAYABLE_HOSTS.includes(host)) {
    return false;
  }

  // If we have an explicit media extension, accept it.
  const pathname = parsed.pathname.toLowerCase();
  if (PLAYABLE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
    return true;
  }

  // Otherwise accept signed object-storage URLs (S3, R2, GCS, Mux, etc.) —
  // they often have no extension but a query string with a signature. We
  // err on the side of attempting playback; the player handles `error`.
  return true;
}

/**
 * Returns true when the URL is recognisably a YouTube or Vimeo page URL,
 * so callers can choose to render an embed iframe instead of `<video>`.
 */
export function isExternalEmbedUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return NON_PLAYABLE_HOSTS.includes(host);
  } catch {
    return false;
  }
}



// ─────────────────────────────────────────────────────────────────────────────
// Thumbnail helpers
// ─────────────────────────────────────────────────────────────────────────────

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"];

const YOUTUBE_HOSTS_FOR_ID_EXTRACTION = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/**
 * Extract an 11-character YouTube video id from any of the URL shapes the
 * codebase stores: youtube.com/watch?v=ID, youtu.be/ID, /embed/ID, /v/ID,
 * /shorts/ID. Returns null when the URL isn't a recognized YouTube link.
 */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!YOUTUBE_HOSTS_FOR_ID_EXTRACTION.has(host)) return null;

    // youtu.be/<id>
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    // youtube.com/watch?v=<id>
    const v = parsed.searchParams.get("v");
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

    // youtube.com/embed/<id>, /v/<id>, /shorts/<id>
    const parts = parsed.pathname.split("/").filter(Boolean);
    const head = parts[0];
    const id = parts[1];
    if ((head === "embed" || head === "v" || head === "shorts") && id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
      return id;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Decide what (if anything) to render in an `<img>` / `<Image>` for a stored
 * `thumbnailUrl`. Returns null when no safe image URL can be derived — the
 * caller should render a placeholder instead of letting `<Image>` 400.
 *
 * Why this exists: an earlier bug copied `video.storageUrl` (which for
 * YouTube imports is a `youtube.com/watch?v=...` page URL) into
 * `Clip.thumbnailUrl`. Feeding a page URL to `next/image` produces a 400
 * because the optimizer:
 *   1. rejects unknown hosts (only `img.youtube.com` was whitelisted),
 *   2. can't decode an HTML page as an image even when whitelisted.
 *
 * For YouTube URLs we route through our own `/api/youtube/thumbnail` proxy
 * (first-party, also avoids strict-tracking-prevention blocks). For real
 * image URLs we pass them through unchanged. For anything else we return
 * null so the renderer falls back to a placeholder.
 */
export function resolveThumbnailUrl(thumbnailUrl: string | null | undefined): string | null {
  if (!thumbnailUrl || typeof thumbnailUrl !== "string") return null;
  const trimmed = thumbnailUrl.trim();
  if (trimmed.length === 0) return null;

  // Same-origin path or blob/data — assume the caller knows what it's doing.
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:image/")
  ) {
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  // YouTube watch/share URL stored in thumbnailUrl by the legacy generator.
  const ytId = extractYouTubeId(trimmed);
  if (ytId) {
    return `/api/youtube/thumbnail?id=${encodeURIComponent(ytId)}&q=mqdefault`;
  }

  // Already a YouTube image (img.youtube.com / i.ytimg.com) — proxy it
  // through our origin so tracking prevention doesn't block it.
  const host = parsed.hostname.toLowerCase();
  if (host === "img.youtube.com" || host === "i.ytimg.com") {
    const m = parsed.pathname.match(/\/vi\/([a-zA-Z0-9_-]{11})\//);
    if (m) return `/api/youtube/thumbnail?id=${m[1]}&q=mqdefault`;
  }

  // Looks like a real image URL (recognized extension or any non-YouTube
  // host that's allowlisted in next.config.mjs). Let the caller pass it to
  // <Image> directly.
  const path = parsed.pathname.toLowerCase();
  if (IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext))) return trimmed;

  // Anything else (bare domain, page URL on an unknown host) — refuse so
  // we don't trigger a 400 from the next/image optimizer.
  return null;
}

/**
 * Convenience: given a stored thumbnailUrl plus the parent video's
 * youtubeId (when known), pick the best displayable image.
 */
export function pickThumbnail(input: {
  thumbnailUrl?: string | null;
  youtubeId?: string | null;
}): string | null {
  const resolved = resolveThumbnailUrl(input.thumbnailUrl);
  if (resolved) return resolved;
  if (input.youtubeId && /^[a-zA-Z0-9_-]{11}$/.test(input.youtubeId)) {
    return `/api/youtube/thumbnail?id=${input.youtubeId}&q=mqdefault`;
  }
  return null;
}
