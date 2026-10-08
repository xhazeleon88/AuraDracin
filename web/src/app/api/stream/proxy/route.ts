import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST_SUFFIXES = [
  "crazymaplestudios.com",
  "goodreels.com",
  "goodbos.online",
  "goodshort.com",
  "dramabuzz.sbs",
  "akamaized.net",
  "cloudfront.net",
  // NetShort progressive MP4 / cover CDNs
  "netshort.com",
  "bytevdn.com",
  "byteimg.com",
];

function isAllowed(url: URL) {
  const host = url.hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

function hostNeedsRedirect(hostname: string) {
  const host = hostname.toLowerCase();
  return (
    host === "netshort.com" ||
    host.endsWith(".netshort.com") ||
    host === "bytevdn.com" ||
    host.endsWith(".bytevdn.com")
  );
}

function shouldProxyUri(uri: string) {
  // Keep data: AES keys and app-local key schemes as-is.
  if (/^(data:|blob:|local:)/i.test(uri)) return false;
  try {
    const parsed = new URL(uri);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    // Relative segment paths should be proxied after absolutizing.
    return true;
  }
}

function rewritePlaylist(body: string, playlistUrl: URL, proxyBase: string) {
  return body
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        // EXT-X-KEY / MAP URI="..."
        return line.replace(/URI="([^"]+)"/g, (full, uri: string) => {
          if (!shouldProxyUri(uri)) return full;
          const absolute = new URL(uri, playlistUrl).toString();
          return `URI="${proxyBase}${encodeURIComponent(absolute)}"`;
        });
      }
      if (!shouldProxyUri(trimmed) && /^[a-z]+:/i.test(trimmed)) {
        return trimmed;
      }
      const absolute = new URL(trimmed, playlistUrl).toString();
      return `${proxyBase}${encodeURIComponent(absolute)}`;
    })
    .join("\n");
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(target.protocol) || !isAllowed(target)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 400 });
  }

  // Progressive CDNs (NetShort): never buffer through the app — hand the
  // browser the origin URL so Range seeks hit the CDN directly.
  if (hostNeedsRedirect(target.hostname)) {
    return NextResponse.redirect(target.toString(), 302);
  }

  try {
    // GoodShort CDN (CloudFront) returns 403 when Referer is
    // goodshort.goodbos.online — fetch without Referer/Origin.
    const upstreamHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      Accept: "*/*",
    };
    const range = req.headers.get("range");
    if (range) upstreamHeaders.Range = range;

    const upstream = await fetch(target.toString(), {
      headers: upstreamHeaders,
      cache: "no-store",
      redirect: "follow",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `upstream ${upstream.status}` },
        { status: upstream.status },
      );
    }

    const contentType = upstream.headers.get("content-type") || "";
    const isPlaylist =
      contentType.includes("mpegurl") ||
      contentType.includes("m3u8") ||
      target.pathname.endsWith(".m3u8");

    if (isPlaylist) {
      const text = await upstream.text();
      // Relative proxy URLs so playlists work behind port-forwards / tunnels.
      const proxyBase = `/api/stream/proxy?url=`;
      const rewritten = rewritePlaylist(text, target, proxyBase);
      return new NextResponse(rewritten, {
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Large progressive video that slipped past the early redirect.
    if (contentType.includes("video/") || contentType.includes("mp4")) {
      return NextResponse.redirect(target.toString(), 302);
    }

    // Small binary assets (AES keys, init segments) — stream through.
    const headers = new Headers();
    headers.set("Content-Type", contentType || "application/octet-stream");
    headers.set("Cache-Control", "public, max-age=3600");
    headers.set("Access-Control-Allow-Origin", "*");
    const len = upstream.headers.get("content-length");
    if (len) headers.set("Content-Length", len);
    const contentRange = upstream.headers.get("content-range");
    if (contentRange) headers.set("Content-Range", contentRange);
    const acceptRanges = upstream.headers.get("accept-ranges");
    if (acceptRanges) headers.set("Accept-Ranges", acceptRanges);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "proxy failed" },
      { status: 502 },
    );
  }
}
