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
  const [hasSubs, setHasSubs] = useState(false);
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

  // Native TextTrack so cues also render during video fullscreen.
  useEffect(() => {
    const video = ref.current;
    if (!video || !subtitleUrl || isImage) {
      setHasSubs(false);
      return;
    }

    let cancelled = false;
    let objectUrl = "";
    let trackEl: HTMLTrackElement | null = null;
    setSubsLoading(true);
    setHasSubs(false);

    // Clear previous tracks/elements
    video.querySelectorAll("track").forEach((el) => el.remove());

    fetch(subtitleUrl)
      .then((r) => r.text())
      .then((text) => {
        if (cancelled || !text.includes("WEBVTT")) return;
        const blob = new Blob([text], { type: "text/vtt" });
        objectUrl = URL.createObjectURL(blob);
        trackEl = document.createElement("track");
        trackEl.kind = "subtitles";
        trackEl.label = "Bahasa";
        trackEl.srclang = "id";
        trackEl.src = objectUrl;
        trackEl.default = true;
        video.appendChild(trackEl);

        const applyMode = () => {
          const track = trackEl?.track;
          if (!track) return;
          track.mode = subsOn ? "showing" : "hidden";
          setHasSubs(true);
        };
        trackEl.addEventListener("load", applyMode);
        // Some browsers expose the track immediately.
        applyMode();
      })
      .catch(() => {
        if (!cancelled) setHasSubs(false);
      })
      .finally(() => {
        if (!cancelled) setSubsLoading(false);
      });

    return () => {
      cancelled = true;
      trackEl?.remove();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-apply mode in separate effect
  }, [subtitleUrl, isImage, src]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i];
      if (track.kind === "subtitles" || track.kind === "captions") {
        track.mode = subsOn ? "showing" : "hidden";
      }
    }
  }, [subsOn, hasSubs, src]);

  // When user hits native fullscreen, keep subtitle mode applied (some browsers reset it).
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reapply = () => {
      for (let i = 0; i < video.textTracks.length; i++) {
        const track = video.textTracks[i];
        if (track.kind === "subtitles" || track.kind === "captions") {
          track.mode = subsOn ? "showing" : "hidden";
        }
      }
    };
    document.addEventListener("fullscreenchange", reapply);
    video.addEventListener("webkitbeginfullscreen", reapply as EventListener);
    video.addEventListener("webkitendfullscreen", reapply as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", reapply);
      video.removeEventListener("webkitbeginfullscreen", reapply as EventListener);
      video.removeEventListener("webkitendfullscreen", reapply as EventListener);
    };
  }, [subsOn, hasSubs]);

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
