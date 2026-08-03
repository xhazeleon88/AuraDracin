"use client";

import { useEffect, useRef } from "react";

export function HlsPlayer({
  src,
  poster,
  type = "hls",
}: {
  src: string;
  poster?: string;
  type?: "hls" | "mp4";
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;

    let hls: { destroy: () => void } | null = null;
    let cancelled = false;

    async function setup() {
      if (type === "mp4" || src.match(/\.(jpg|jpeg|png|webp)$/i)) {
        video!.src = src;
        return;
      }

      if (video!.canPlayType("application/vnd.apple.mpegurl")) {
        video!.src = src;
        return;
      }

      const Hls = (await import("hls.js")).default;
      if (cancelled) return;
      if (Hls.isSupported()) {
        const instance = new Hls();
        instance.loadSource(src);
        instance.attachMedia(video!);
        hls = instance;
      } else {
        video!.src = src;
      }
    }

    setup();
    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [src, type]);

  const isImage = Boolean(src.match(/\.(jpg|jpeg|png|webp)$/i));

  if (isImage) {
    return (
      <div className="relative h-full w-full">
        <img src={src} alt="" className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-black/40">
            <i className="fa-solid fa-play text-[22px] text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={ref}
      className="h-full w-full object-cover"
      controls
      playsInline
      poster={poster}
    />
  );
}
