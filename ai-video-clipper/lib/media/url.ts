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
