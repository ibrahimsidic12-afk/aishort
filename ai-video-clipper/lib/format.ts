/**
 * Date/number formatting helpers that produce identical output on the
 * server and the client.
 *
 * Why this file exists: server components rendered `new Date(x).toLocaleDateString()`
 * directly. The Node runtime on the deployment formats dates with the
 * server's locale (typically `en-US`), while the user's browser uses its
 * own locale. The two strings differ — for example "5/19/2026" vs
 * "19/05/2026" — which causes React hydration mismatches (Minified React
 * error #418) and triggers a recovery roundtrip that some Next.js builds
 * surface as a 4xx response.
 *
 * Use these helpers in any server component that renders a date inside
 * markup that will hydrate on the client.
 */

const MONTHS_SHORT_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Coerce anything that "looks like a date" into a Date instance, or null
 * if it can't be parsed. Defensive: server components occasionally
 * receive raw Prisma values, ISO strings (after JSON serialization),
 * numeric epoch ms, or already-instantiated Date objects.
 */
function coerceDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Format a date as a stable, locale-independent string like "May 19, 2026".
 * Uses the date's UTC components so the same Date renders identically
 * regardless of the rendering environment's time zone.
 */
export function formatDate(value: unknown): string {
  const d = coerceDate(value);
  if (!d) return "";
  const month = MONTHS_SHORT_EN[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * Compact ISO-ish date "2026-05-19". Useful in dense UI like file lists.
 */
export function formatDateISO(value: unknown): string {
  const d = coerceDate(value);
  if (!d) return "";
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}
