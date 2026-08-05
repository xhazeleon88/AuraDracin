"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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

type Cue = { start: number; end: number; text: string };

function parseVtt(raw: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = raw.replace(/\r/g, "").split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    if (!lines.length || lines[0] === "WEBVTT" || lines[0].startsWith("NOTE")) continue;
    const timeLine = lines.find((l) => l.includes("-->"));
    if (!timeLine) continue;
    const [startRaw, endRaw] = timeLine.split("-->").map((s) => s.trim());
    const text = lines.slice(lines.indexOf(timeLine) + 1).join(" ").trim();
    const start = vttToSeconds(startRaw);
    const end = vttToSeconds(endRaw.split(/\s/)[0]);
    if (text && end > start) cues.push({ start, end, text });
  }
  return cues;
}

function vttToSeconds(stamp: string) {
  const clean = stamp.trim().replace(",", ".");
  const parts = clean.split(":");
  if (parts.length === 3) {
    return Number(parts[0]) * 3600 + Number(parts[1]) * 60 + Number(parts[2]);
  }
  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number(parts[1]);
  }
  return Number(clean) || 0;
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
  const ref = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [advancing, setAdvancing] = useState(false);
  const [subsOn, setSubsOn] = useState(true);
  const [subsLoading, setSubsLoading] = useState(false);
  const [cues, setCues] = useState<Cue[]>([]);
  const [activeCue, setActiveCue] = useState("");
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

  useEffect(() => {
    if (!subtitleUrl || isImage) {
      setCues([]);
      setActiveCue("");
      return;
    }
    let cancelled = false;
    setSubsLoading(true);
    setCues([]);
    setActiveCue("");
    fetch(subtitleUrl)
      .then((r) => r.text())
      .then((text) => {
        if (cancelled) return;
        setCues(parseVtt(text));
      })
      .catch(() => {
        if (!cancelled) setCues([]);
      })
      .finally(() => {
        if (!cancelled) setSubsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subtitleUrl, isImage, src]);

  useEffect(() => {
    const video = ref.current;
    if (!video || !cues.length) return;
    const onTime = () => {
      if (!subsOn) {
        setActiveCue("");
        return;
      }
      const t = video.currentTime;
      const hit = cues.find((c) => t >= c.start && t <= c.end);
      setActiveCue(hit?.text || "");
    };
    video.addEventListener("timeupdate", onTime);
    onTime();
    return () => video.removeEventListener("timeupdate", onTime);
  }, [cues, subsOn, src]);

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
        poster={poster}
        crossOrigin="anonymous"
      />

      {subtitleUrl ? (
        <button
          type="button"
          className={`absolute right-2 top-2 z-30 border px-2.5 py-1 text-[11px] font-bold ${
            subsOn
              ? "border-white bg-black/70 text-white"
              : "border-white/40 bg-black/40 text-white/70"
          }`}
          onClick={() => setSubsOn((v) => !v)}
          aria-pressed={subsOn}
        >
          {subsLoading ? "Subtitle…" : subsOn ? "Subtitle ON" : "Subtitle OFF"}
        </button>
      ) : null}

      {subsOn && activeCue ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-16 z-20 flex justify-center">
          <p className="max-w-[92%] bg-black/75 px-3 py-1.5 text-center text-[13px] font-semibold leading-snug text-white">
            {activeCue}
          </p>
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
