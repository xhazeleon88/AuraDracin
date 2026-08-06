import {
  clampImageQuality,
  clampImageWidth,
  IMAGE_CACHE_CONTROL,
  IMAGE_CACHE_TTL_SEC,
} from "@/lib/image";
import { getCloudflareEnv, getExecutionCtx, type CloudflareBindings } from "@/lib/cf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WorkersCacheStorage = CacheStorage & { default: Cache };

function getWorkersCache(): Cache | undefined {
  try {
    const cacheStorage = (globalThis as typeof globalThis & { caches?: WorkersCacheStorage }).caches;
    return cacheStorage?.default;
  } catch {
    return undefined;
  }
}

type ImagesBinding = {
  input: (stream: ReadableStream | ArrayBuffer | Uint8Array) => {
    transform: (opts: { width?: number; height?: number; fit?: string }) => {
      output: (opts: { format: string; quality?: number }) => Promise<{
        response: () => Response;
        image: () => ReadableStream;
      }>;
    };
  };
};

function badRequest(message: string, status = 400) {
  return new Response(message, {
    status,
    headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
  });
}

function isBlockedHost(hostname: string) {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h === "0.0.0.0" || h === "::1" || h === "[::1]") return true;
  // Block obvious private / metadata hosts
  if (/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(h)) return true;
  if (h === "metadata.google.internal") return true;
  return false;
}

function resolveSourceUrl(raw: string, requestUrl: URL): URL | null {
  try {
    if (raw.startsWith("/")) {
      return new URL(raw, requestUrl.origin);
    }
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (isBlockedHost(u.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}

function withCacheHeaders(res: Response, contentType: string) {
  const headers = new Headers(res.headers);
  headers.set("Content-Type", contentType);
  headers.set("Cache-Control", IMAGE_CACHE_CONTROL);
  headers.set("CDN-Cache-Control", `public, max-age=${IMAGE_CACHE_TTL_SEC}`);
  headers.set("Cloudflare-CDN-Cache-Control", `public, max-age=${IMAGE_CACHE_TTL_SEC}`);
  headers.set("Vary", "Accept");
  headers.set("X-Aura-Image", "webp");
  // Avoid forcing download disposition
  headers.delete("Content-Disposition");
  return new Response(res.body, { status: 200, headers });
}

async function fetchUpstream(url: URL, timeoutMs = 10_000) {
  return fetch(url.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 AuraDracin-Image/1.0",
      Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      Referer: url.origin + "/",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
}

async function transformToWebp(
  env: CloudflareBindings,
  bytes: ArrayBuffer,
  width: number,
  quality: number,
): Promise<Response | null> {
  const images = env.IMAGES as ImagesBinding | undefined;
  if (!images?.input) return null;
  try {
    const result = await images
      .input(bytes)
      .transform({ width, fit: "scale-down" })
      .output({ format: "image/webp", quality });
    return result.response();
  } catch (err) {
    console.error("IMAGES transform failed", err);
    return null;
  }
}

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const rawUrl = reqUrl.searchParams.get("url") || "";
  const width = clampImageWidth(Number(reqUrl.searchParams.get("w") || 640) || 640);
  const quality = clampImageQuality(Number(reqUrl.searchParams.get("q") || 75) || 75);

  if (!rawUrl) return badRequest('"url" is required');
  if (rawUrl.length > 2048) return badRequest('"url" is too long');

  const source = resolveSourceUrl(rawUrl, reqUrl);
  if (!source) return badRequest('"url" is invalid or blocked');

  // Edge cache key — include transform params.
  const cacheKeyUrl = new URL(reqUrl.toString());
  cacheKeyUrl.searchParams.set("w", String(width));
  cacheKeyUrl.searchParams.set("q", String(quality));
  cacheKeyUrl.searchParams.set("f", "webp");
  const cacheKey = new Request(cacheKeyUrl.toString(), { method: "GET" });

  try {
    const cache = getWorkersCache();
    const cached = cache ? await cache.match(cacheKey) : undefined;
    if (cached) {
      const hit = new Response(cached.body, cached);
      hit.headers.set("X-Aura-Cache", "HIT");
      return hit;
    }
  } catch {
    /* caches.default may be unavailable locally */
  }

  let upstream: Response;
  try {
    upstream = await fetchUpstream(source);
  } catch {
    return badRequest("Failed to fetch source image", 502);
  }
  if (!upstream.ok) {
    return badRequest(`Upstream image HTTP ${upstream.status}`, upstream.status === 404 ? 404 : 502);
  }

  const bytes = await upstream.arrayBuffer();
  if (!bytes.byteLength) return badRequest("Empty image", 502);
  if (bytes.byteLength > 12 * 1024 * 1024) return badRequest("Image too large", 413);

  const env = await getCloudflareEnv();
  let out: Response | null = null;
  if (env) {
    out = await transformToWebp(env, bytes, width, quality);
  }

  // Fallback: pass through original bytes (still with long cache) when IMAGES is unavailable (local).
  const response = out
    ? withCacheHeaders(out, "image/webp")
    : withCacheHeaders(
        new Response(bytes, {
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") || "application/octet-stream",
          },
        }),
        upstream.headers.get("Content-Type") || "application/octet-stream",
      );

  response.headers.set("X-Aura-Cache", "MISS");

  try {
    const cache = getWorkersCache();
    if (cache) {
      const ctx = await getExecutionCtx();
      const put = cache.put(cacheKey, response.clone());
      if (ctx?.waitUntil) ctx.waitUntil(put);
      else await put;
    }
  } catch {
    /* ignore cache put failures */
  }

  return response;
}
