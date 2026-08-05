"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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
  const [subsOn, setSubsOn] = useState(true);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsError, setSubsError] = useState("");
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
      setSubsError("");
      setSubsLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setSubsLoading(true);
    setSubsError("");
    setCues([]);
    setActiveText("");

    fetch(subtitleUrl, { signal: controller.signal })
      .then(async (res) => {
        const text = await res.text();
        if (cancelled) return;
        if (!text.includes("WEBVTT")) {
          setSubsError("Subtitle gagal dimuat");
          return;
        }
        const parsed = parseVtt(text);
        if (!parsed.length) {
          const note = text.match(/NOTE\s*\n([\s\S]*?)(?:\n\n|$)/)?.[1]?.trim();
          setSubsError(note || "Subtitle belum tersedia");
          setCues([]);
          return;
        }
        setCues(parsed);
        setSubsError("");
      })
      .catch((err) => {
        if (cancelled || err?.name === "AbortError") return;
        setSubsError("Subtitle gagal dimuat");
        setCues([]);
      })
      .finally(() => {
        if (!cancelled) setSubsLoading(false);
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

    const sync = () => {
      if (!subsOn) {
        setActiveText("");
        return;
      }
      const t = video.currentTime || 0;
      const hit = cues.find((c) => t >= c.start && t < c.end);
      setActiveText(hit?.text || "");
    };

    sync();
    video.addEventListener("timeupdate", sync);
    video.addEventListener("seeked", sync);
    video.addEventListener("play", sync);
    return () => {
      video.removeEventListener("timeupdate", sync);
      video.removeEventListener("seeked", sync);
      video.removeEventListener("play", sync);
    };
  }, [cues, hasSubs, subsOn, src]);

  const statusLabel = useMemo(() => {
    if (subsLoading) return "Subtitle…";
    if (!hasSubs && subsError) return "Subtitle ✕";
    return subsOn ? "Subtitle ON" : "Subtitle OFF";
  }, [subsLoading, hasSubs, subsError, subsOn]);

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

      {subsOn && activeText ? (
        <div className="subtitle-overlay pointer-events-none absolute inset-x-0 bottom-[72px] z-20 flex justify-center px-4 sm:bottom-[58px]">
          <div className="max-w-[92%] whitespace-pre-line rounded bg-black/75 px-3 py-1.5 text-center text-[13px] font-semibold leading-snug text-white shadow-sm">
            {activeText}
          </div>
        </div>
      ) : null}

      {subtitleUrl ? (
        <button
          type="button"
          className={`absolute right-2 top-2 z-30 border px-2.5 py-1 text-[11px] font-bold ${
            subsOn && hasSubs
              ? "border-white bg-black/70 text-white"
              : "border-white/40 bg-black/40 text-white/70"
          }`}
          onClick={() => setSubsOn((v) => !v)}
          aria-pressed={subsOn}
          title={subsError || undefined}
        >
          {statusLabel}
        </button>
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
