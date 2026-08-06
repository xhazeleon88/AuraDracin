/**
 * Client-safe helpers for AuraDracin image optimization.
 * All next/image requests go through /api/img → WebP (+ long browser/CDN cache).
 */

export const IMAGE_CACHE_CONTROL =
  "public, max-age=2592000, stale-while-revalidate=86400, immutable";

/** 30 days — matches Cache-Control max-age. */
export const IMAGE_CACHE_TTL_SEC = 2_592_000;

const ALLOWED_WIDTHS = new Set([
  16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840,
]);

export function clampImageWidth(width: number) {
  if (ALLOWED_WIDTHS.has(width)) return width;
  const sorted = [...ALLOWED_WIDTHS].sort((a, b) => a - b);
  for (const w of sorted) {
    if (w >= width) return w;
  }
  return sorted[sorted.length - 1];
}

export function clampImageQuality(quality?: number) {
  const q = typeof quality === "number" && Number.isFinite(quality) ? Math.round(quality) : 75;
  return Math.min(100, Math.max(30, q));
}

/** Build optimized image URL used by the custom next/image loader. */
export function optimizedImageSrc(src: string, width: number, quality = 75) {
  if (!src) return src;
  // Already optimized
  if (src.startsWith("/api/img?") || src.includes("/api/img?")) return src;
  // Data / blob URLs can't be proxied
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;

  const params = new URLSearchParams();
  params.set("url", src);
  params.set("w", String(clampImageWidth(width)));
  params.set("q", String(clampImageQuality(quality)));
  return `/api/img?${params.toString()}`;
}
