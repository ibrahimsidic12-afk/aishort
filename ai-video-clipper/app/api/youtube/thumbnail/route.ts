import { NextRequest, NextResponse } from "next/server";

/**
 * First-party proxy for YouTube thumbnails.
 *
 * Browsers with strict privacy modes (Edge Tracking Prevention, Brave Shields,
 * Firefox ETP, etc.) block direct requests to `img.youtube.com` because it's
 * classified as a Google-owned tracking host. The block produces console
 * noise like:
 *
 *   Tracking Prevention blocked access to storage for
 *   https://img.youtube.com/vi/<id>/mqdefault.jpg
 *
 * Routing the same image through our own origin makes it a first-party
 * request from the browser's perspective, so the block doesn't apply.
 *
 * Usage from the client:
 *   <img src={`/api/youtube/thumbnail?id=${videoId}&q=mqdefault`} />
 */

const ALLOWED_QUALITIES = new Set([
  "default",       // 120x90
  "mqdefault",     // 320x180
  "hqdefault",     // 480x360
  "sddefault",     // 640x480
  "maxresdefault", // 1280x720 (not always available)
]);

// 11-character YouTube IDs only — same character set the regex elsewhere uses.
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const qParam = searchParams.get("q") ?? "mqdefault";

  if (!id || !YOUTUBE_ID_REGEX.test(id)) {
    return NextResponse.json(
      { error: "Missing or invalid YouTube video id" },
      { status: 400 }
    );
  }
  const quality = ALLOWED_QUALITIES.has(qParam) ? qParam : "mqdefault";

  const upstream = `https://i.ytimg.com/vi/${id}/${quality}.jpg`;

  try {
    const upstreamRes = await fetch(upstream, {
      // Edge runtime supports `next: { revalidate }`. Cache for 1 day —
      // YouTube thumbnails are effectively immutable per (id, quality).
      next: { revalidate: 86400 },
      headers: {
        // Some YouTube CDN nodes 403 requests without a UA.
        "User-Agent":
          "Mozilla/5.0 (compatible; AIShort/1.0; +https://aishort.local)",
      },
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      // Fall back to the lower-quality default that's almost always present.
      if (quality !== "mqdefault") {
        const fallback = await fetch(
          `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
          { next: { revalidate: 86400 } }
        );
        if (fallback.ok && fallback.body) {
          return streamImage(fallback);
        }
      }
      return NextResponse.json(
        { error: "Thumbnail not available" },
        { status: 404 }
      );
    }

    return streamImage(upstreamRes);
  } catch (err) {
    console.error("[YT_THUMBNAIL_PROXY] upstream fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch thumbnail" },
      { status: 502 }
    );
  }
}

function streamImage(res: Response): Response {
  return new NextResponse(res.body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
      // Browser cache for a day; CDN/edge cache for a week.
      "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
      // Don't leak our own request headers downstream.
      "X-Content-Type-Options": "nosniff",
    },
  });
}
