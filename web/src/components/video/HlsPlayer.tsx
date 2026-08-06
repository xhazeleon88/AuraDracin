"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Cue = { start: number; end: number; text: string };

const SUBS_PREF_KEY = "aura-dracin-subs-bahasa";

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
  const normalized =
    text.includes("\\n") && text.split("\n").length < 3
      ? text.replace(/\\n/g, "\n").replace(/\\"/g, '"')
      : text;
  const body = normalized.replace(/^\uFEFF?WEBVTT[^\n]*\n/, "");
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

function readSubsPref(): boolean {
  if (typeof window === "undefined") return true;
  const raw = window.localStorage.getItem(SUBS_PREF_KEY);
  if (raw === null) return true; // Default: Bahasa ON
  return raw !== "0";
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
  const [subsOn, setSubsOn] = useState(true);
  const [subsPending, setSubsPending] = useState(false);
  const playable = toPlayableSrc(src, type);
  const isImage = Boolean(src.match(/\.(jpg|jpeg|png|webp)(\?|$)/i));
  const hasSubs = cues.length > 0;

  useEffect(() => {
    setSubsOn(readSubsPref());
  }, []);

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
          // Prefer our Bahasa overlay — ignore embedded/English text tracks.
          enableWebVTT: false,
          enableIMSC1: false,
          enableCEA708Captions: false,
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
          // Disable any native tracks the browser might still expose.
          try {
            const tracks = video!.textTracks;
            for (let i = 0; i < tracks.length; i++) {
              tracks[i].mode = "disabled";
            }
          } catch {
            /* ignore */
          }
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

  // Custom Bahasa cue overlay — default ON. Poll while Workers AI generates.
  useEffect(() => {
    if (!subtitleUrl || isImage) {
      setCues([]);
      setActiveText("");
      setSubsPending(false);
      return;
    }

    let cancelled = false;
    let timer = 0;
    const controller = new AbortController();
    setCues([]);
    setActiveText("");
    setSubsPending(true);

    async function loadOnce(): Promise<"ready" | "pending" | "empty"> {
      const res = await fetch(subtitleUrl!, { signal: controller.signal });
      const text = await res.text();
      if (cancelled) return "empty";
      if (!text.includes("WEBVTT")) {
        setCues([]);
        return "empty";
      }
      const parsed = parseVtt(text);
      if (parsed.length) {
        setCues(parsed);
        setSubsPending(false);
        return "ready";
      }
      if (/sedang dibuat|sedang disiapkan|generating/i.test(text)) {
        setSubsPending(true);
        return "pending";
      }
      setSubsPending(false);
      return "empty";
    }

    async function poll() {
      try {
        const state = await loadOnce();
        if (cancelled || state === "ready" || state === "empty") return;
        let attempts = 0;
        const tick = async () => {
          if (cancelled || attempts >= 45) {
            setSubsPending(false);
            return;
          }
          attempts += 1;
          try {
            const next = await loadOnce();
            if (next === "ready" || next === "empty") return;
          } catch {
            /* keep polling */
          }
          timer = window.setTimeout(tick, 2000);
        };
        timer = window.setTimeout(tick, 2000);
      } catch (err) {
        if (cancelled || (err as { name?: string })?.name === "AbortError") return;
        setCues([]);
        setSubsPending(false);
      }
    }

    void poll();

    return () => {
      cancelled = true;
      controller.abort();
      if (timer) window.clearTimeout(timer);
    };
  }, [subtitleUrl, isImage, src]);

  useEffect(() => {
    const video = ref.current;
    if (!video || !hasSubs || !subsOn) {
      setActiveText("");
      return;
    }

    // Trust VTT times from Whisper (no baked lead). Tiny early bias only so
    // text is readable slightly before the ear catches the word (~1 frame).
    const OFFSET = 0.12;
    let raf = 0;
    let alive = true;

    const pickCue = (t: number): string => {
      for (let i = 0; i < cues.length; i += 1) {
        const c = cues[i];
        if (t >= c.start && t < c.end) return c.text;
      }
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
  }, [cues, hasSubs, subsOn, src]);

  function toggleSubs() {
    setSubsOn((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SUBS_PREF_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

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
        crossOrigin="anonymous"
        poster={poster}
      />

      {/* Opaque Bahasa overlay sits over burned-in English hardsubs near the bottom. */}
      {subsOn && activeText ? (
        <div className="subtitle-overlay pointer-events-none absolute inset-x-0 bottom-[88px] z-30 flex justify-center px-3">
          <div className="max-w-[94%] whitespace-pre-line bg-black/92 px-3.5 py-2 text-center text-[15px] font-semibold leading-snug text-white shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
            {activeText}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={toggleSubs}
        className="absolute bottom-[52px] right-2 z-40 rounded border border-white/30 bg-black/70 px-2 py-1 text-[11px] font-bold tracking-wide text-white"
        aria-pressed={subsOn}
        aria-label={subsOn ? "Matikan subtitle Bahasa" : "Nyalakan subtitle Bahasa"}
        title="Subtitle Bahasa"
      >
        {subsOn ? "ID ON" : "ID OFF"}
        {subsPending && subsOn ? "…" : ""}
      </button>

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
