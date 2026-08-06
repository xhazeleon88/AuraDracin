/**
 * Custom next/image loader — routes every image through /api/img (WebP + cache).
 * Used via next.config.ts `images.loaderFile`.
 */
export default function auraImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (!src) return src;
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  if (src.startsWith("/api/img?")) return src;

  const params = new URLSearchParams();
  params.set("url", src);
  params.set("w", String(width));
  params.set("q", String(quality ?? 75));
  return `/api/img?${params.toString()}`;
}
