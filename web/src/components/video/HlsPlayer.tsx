"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function toPlayableSrc(src: string, type: "hls" | "mp4") {
  if (!src) return src;
  if (src.startsWith("/") || src.startsWith("blob:") || src.startsWith("data:")) {
    return src;
  }
  if (type === "mp4" && src.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) return src;
  // Proxy remote media to avoid CDN CORS / hotlink blocks in the browser.
  if (/^https?:\/\//i.test(src)) {
    return `/api/stream/proxy?url=${encodeURIComponent(src)}`;
  }
  return src;
}

function looksLikeHls(src: string, type: "hls" | "mp4") {
  return type === "hls" || /\.m3u8(\?|$)/i.test(src) || /[?&]url=.*m3u8/i.test(src);
}

export function HlsPlayer({
  src,
  poster,
  type = "hls",
  nextHref,
}: {
  src: string;
  poster?: string;
  type?: "hls" | "mp4";
  /** When set, navigate here when the current episode ends. */
  nextHref?: string;
}) {
  const router = useRouter();
  const ref = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [advancing, setAdvancing] = useState(false);
  const playable = toPlayableSrc(src, type);
  const isImage = Boolean(src.match(/\.(jpg|jpeg|png|webp)(\?|$)/i));

  useEffect(() => {
    setAdvancing(false);
  }, [src]);

  useEffect(() => {
    const video = ref.current;
    if (!video || !playable || isImage) return;

    let hls: { destroy: () => void } | null = null;
    let cancelled = false;
    setError("");

    async function setup() {
      const isHls = looksLikeHls(src, type);

      if (!isHls) {
        video!.src = playable;
        try {
          await video!.play();
        } catch {
          // autoplay may be blocked; controls remain available
        }
        return;
      }

      const Hls = (await import("hls.js")).default;
      if (cancelled) return;

      // Chrome reports canPlayType(mpegurl) as "maybe" but cannot actually
      // play HLS natively. Prefer hls.js whenever MSE is available.
      if (Hls.isSupported()) {
        const instance = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          xhrSetup(xhr) {
            xhr.withCredentials = false;
          },
        });
        let mediaRecoveryAttempts = 0;
        instance.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          console.error("HLS fatal", data.type, data.details, data);
          if (data.details === "bufferAddCodecError") {
            setError("Codec video tidak didukung browser ini (coba Chrome/Safari terbaru).");
            instance.destroy();
            return;
          }
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setError(`Gagal load video (${data.details || data.type})`);
            instance.startLoad();
            return;
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && mediaRecoveryAttempts < 2) {
            mediaRecoveryAttempts += 1;
            instance.recoverMediaError();
            return;
          }
          setError(`Gagal load video (${data.details || data.type})`);
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
        return;
      }

      // Safari / iOS native HLS fallback
      if (video!.canPlayType("application/vnd.apple.mpegurl")) {
        video!.src = playable;
        try {
          await video!.play();
        } catch {
          /* ignore */
        }
        return;
      }

      setError("Browser tidak support HLS playback");
    }

    setup().catch((err) => {
      setError(err instanceof Error ? err.message : "Player error");
    });

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [playable, src, type, isImage]);

  useEffect(() => {
    const video = ref.current;
    if (!video || isImage || !nextHref) return;

    const onEnded = () => {
      setAdvancing(true);
      router.push(nextHref);
    };
    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
  }, [nextHref, router, isImage, src]);

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
      {advancing ? (
        <div className="absolute inset-x-0 bottom-12 z-20 bg-black/75 px-3 py-2 text-center text-xs text-white">
          Lanjut episode berikutnya…
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-x-0 bottom-0 bg-black/75 px-3 py-2 text-center text-xs text-white">
          {error}
        </div>
      ) : null}
    </div>
  );
}
