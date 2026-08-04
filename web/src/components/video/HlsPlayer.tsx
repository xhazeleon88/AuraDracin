"use client";

import { useEffect, useRef, useState } from "react";

function toPlayableSrc(src: string, type: "hls" | "mp4") {
  if (!src) return src;
  if (src.startsWith("/") || src.startsWith("blob:")) return src;
  if (type === "mp4" && src.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) return src;
  // Proxy remote media to avoid CDN CORS / hotlink blocks in the browser.
  if (/^https?:\/\//i.test(src)) {
    return `/api/stream/proxy?url=${encodeURIComponent(src)}`;
  }
  return src;
}

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
  const [error, setError] = useState("");
  const playable = toPlayableSrc(src, type);
  const isImage = Boolean(src.match(/\.(jpg|jpeg|png|webp)(\?|$)/i));

  useEffect(() => {
    const video = ref.current;
    if (!video || !playable || isImage) return;

    let hls: { destroy: () => void } | null = null;
    let cancelled = false;
    setError("");

    async function setup() {
      // Decide from original src/type — proxied URLs lose the .m3u8 suffix.
      const looksHls =
        type === "hls" || /\.m3u8(\?|$)/i.test(src) || src.includes("mpegurl");

      if (!looksHls) {
        video!.src = playable;
        try {
          await video!.play();
        } catch {
          // autoplay may be blocked; controls remain available
        }
        return;
      }

      if (video!.canPlayType("application/vnd.apple.mpegurl")) {
        video!.src = playable;
        try {
          await video!.play();
        } catch {
          /* ignore */
        }
        return;
      }

      const Hls = (await import("hls.js")).default;
      if (cancelled) return;

      if (!Hls.isSupported()) {
        setError("Browser tidak support HLS playback");
        return;
      }

      const instance = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });
      instance.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        setError(`Gagal load video (${data.type})`);
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) instance.startLoad();
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) instance.recoverMediaError();
      });
      instance.loadSource(playable);
      instance.attachMedia(video!);
      instance.on(Hls.Events.MANIFEST_PARSED, async () => {
        try {
          await video!.play();
        } catch {
          /* ignore autoplay block */
        }
      });
      hls = instance;
    }

    setup().catch((err) => {
      setError(err instanceof Error ? err.message : "Player error");
    });

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [playable, src, type, isImage]);

  if (isImage) {
    return (
      <div className="relative h-full w-full">
        <img src={src} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-center text-xs text-white">
          Stream belum tersedia untuk item ini (preview cover).
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={ref}
        className="h-full w-full object-contain"
        controls
        playsInline
        autoPlay
        muted
        poster={poster}
      />
      {error ? (
        <div className="absolute inset-x-0 bottom-0 bg-black/75 px-3 py-2 text-center text-xs text-white">
          {error}
        </div>
      ) : null}
    </div>
  );
}
