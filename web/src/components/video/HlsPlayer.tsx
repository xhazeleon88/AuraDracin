"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Cue = { start: number; end: number; text: string };

function toPlayableSrc(src: string, type: "hls" | "mp4") {
  if (!src) return src;
  if (src.startsWith("/") || src.startsWith("blob:") || src.startsWith("data:")) {
    return src;
  }
  if (type === "mp4" && src.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) return src;
  if (/^https?:\/\//i.test(src)) {
    return `/api/stream/proxy?url=${encodeURIComponent(src)}`;
  }
  return src;
}

function looksLikeHls(src: string, type: "hls" | "mp4") {
  return type === "hls" || /\.m3u8(\?|$)/i.test(src) || /[?&]url=.*m3u8/i.test(src);
}

function parseVttTime(raw: string) {
  const parts = raw.trim().split(":");
  if (parts.length < 2) return 0;
  const hours = parts.length === 3 ? Number(parts[0]) : 0;
  const minutes = Number(parts.length === 3 ? parts[1] : parts[0]);
  const secParts = (parts.length === 3 ? parts[2] : parts[1]).split(".");
  const seconds = Number(secParts[0] || 0);
  const millis = Number((secParts[1] || "0").padEnd(3, "0").slice(0, 3));
  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

function parseVtt(text: string): Cue[] {
  const body = text.replace(/^\uFEFF?WEBVTT[^\n]*\n/, "");
  const blocks = body.split(/\n\s*\n/);
  const cues: Cue[] = [];

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((l) => l.trimEnd())
      .filter((l) => l.length > 0);
    if (!lines.length) continue;
    if (lines[0].startsWith("NOTE") || lines[0].startsWith("STYLE") || lines[0].startsWith("REGION")) {
      continue;
    }

    let idx = 0;
    if (lines[0] && !lines[0].includes("-->")) idx = 1;
    const timing = lines[idx];
    if (!timing || !timing.includes("-->")) continue;
    const [startRaw, endRaw] = timing.split("-->").map((s) => s.trim().split(/\s+/)[0]);
    const start = parseVttTime(startRaw || "");
    const end = parseVttTime(endRaw || "");
    const textLines = lines.slice(idx + 1).join("\n").replace(/<[^>]+>/g, "").trim();
    if (!textLines || !(end > start)) continue;
    cues.push({ start, end, text: textLines });
  }
  return cues;
}

export function HlsPlayer({
  src,
  poster,
  type = "hls",
  nextHref,
  subtitleUrl,
}: {
  src: string;
  poster?: string;
  type?: "hls" | "mp4";
  nextHref?: string;
  subtitleUrl?: string;
}) {
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [advancing, setAdvancing] = useState(false);
  const [cues, setCues] = useState<Cue[]>([]);
  const [activeText, setActiveText] = useState("");
  const playable = toPlayableSrc(src, type);
  const isImage = Boolean(src.match(/\.(jpg|jpeg|png|webp)(\?|$)/i));
  const hasSubs = cues.length > 0;

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
        video!.muted = false;
        video!.src = playable;
        try {
          await video!.play();
        } catch {
          /* unmuted autoplay may be blocked */
        }
        return;
      }

      const Hls = (await import("hls.js")).default;
      if (cancelled) return;

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
          video!.muted = false;
          try {
            await video!.play();
          } catch {
            /* unmuted autoplay may be blocked */
          }
        });
        hls = instance;
        return;
      }

      if (video!.canPlayType("application/vnd.apple.mpegurl")) {
        video!.muted = false;
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

  // Custom cue overlay — more reliable than native TextTrack with HLS.js.
  useEffect(() => {
    if (!subtitleUrl || isImage) {
      setCues([]);
      setActiveText("");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setCues([]);
    setActiveText("");

    fetch(subtitleUrl, { signal: controller.signal })
      .then(async (res) => {
        const text = await res.text();
        if (cancelled) return;
        if (!text.includes("WEBVTT")) {
          setCues([]);
          return;
        }
        const parsed = parseVtt(text);
        setCues(parsed);
      })
      .catch((err) => {
        if (cancelled || err?.name === "AbortError") return;
        setCues([]);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [subtitleUrl, isImage, src]);

  useEffect(() => {
    const video = ref.current;
    if (!video || !hasSubs) {
      setActiveText("");
      return;
    }

    // Trust VTT times from Whisper (no baked lead). Tiny early bias only so
    // text is readable slightly before the ear catches the word (~1 frame).
    const OFFSET = 0.12;
    let raf = 0;
    let alive = true;

    const pickCue = (t: number): string => {
      // Active cue
      for (let i = 0; i < cues.length; i += 1) {
        const c = cues[i];
        if (t >= c.start && t < c.end) return c.text;
      }
      // Hold previous line across tiny gaps so sync feels continuous
      for (let i = 0; i < cues.length - 1; i += 1) {
        const cur = cues[i];
        const next = cues[i + 1];
        if (t >= cur.end && t < next.start && next.start - cur.end < 0.8) {
          return cur.text;
        }
      }
      return "";
    };

    const sync = () => {
      if (!alive) return;
      setActiveText(pickCue((video.currentTime || 0) + OFFSET));
    };

    const tick = () => {
      sync();
      if (alive && !video.paused && !video.ended) {
        raf = requestAnimationFrame(tick);
      }
    };

    const onPlay = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    };
    const onPause = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      sync();
    };

    sync();
    if (!video.paused) onPlay();
    video.addEventListener("play", onPlay);
    video.addEventListener("playing", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", sync);
    video.addEventListener("timeupdate", sync);
    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("playing", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeked", sync);
      video.removeEventListener("timeupdate", sync);
    };
  }, [cues, hasSubs, src]);

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
    <div ref={shellRef} className="relative h-full w-full bg-black">
      <video
        ref={ref}
        className="h-full w-full object-contain"
        controls
        playsInline
        autoPlay
        poster={poster}
      />

      {activeText ? (
        <div className="subtitle-overlay pointer-events-none absolute inset-x-0 bottom-[96px] z-30 flex justify-center px-4">
          <div className="max-w-[92%] whitespace-pre-line rounded bg-black/80 px-3 py-1.5 text-center text-[14px] font-semibold leading-snug text-white shadow-sm">
            {activeText}
          </div>
        </div>
      ) : null}

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
