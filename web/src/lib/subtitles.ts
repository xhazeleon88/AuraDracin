import { createHash } from "crypto";
import { getCloudflareEnv, runInBackground, type CloudflareBindings } from "./cf";
import { dbFirst, dbRun, subtitlesGenerationEnabled } from "./db";
import { translateManyToBahasa, withLiveTranslate } from "./translate";

const whisperBin = process.env.WHISPER_BIN || "/home/ubuntu/.local/bin/whisper";
/** Bump when generation pipeline / cue timing changes. */
const CACHE_VERSION = "v4";

function cacheId(provider: string, dramaId: string, episode: number) {
  return createHash("sha256")
    .update(`${CACHE_VERSION}:${provider}:${dramaId}:${episode}`)
    .digest("hex")
    .slice(0, 32);
}

function cleanSpawnEnv(): NodeJS.ProcessEnv {
  // tmux/agent LD_LIBRARY_PATH can break ffmpeg/whisper (libncursesw mismatch).
  const env = { ...process.env };
  delete env.LD_LIBRARY_PATH;
  delete env.LD_PRELOAD;
  return env;
}

async function run(
  cmd: string,
  args: string[],
  timeoutMs = 180000,
): Promise<{ code: number; stdout: string; stderr: string }> {
  const { spawn } = await import("child_process");
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: cleanSpawnEnv(),
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
    }, timeoutMs);
    child.stdout.on("data", (d) => {
      stdout += String(d);
    });
    child.stderr.on("data", (d) => {
      stderr += String(d);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

function toVttTime(seconds: number) {
  const ms = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const milli = ms % 1000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(milli).padStart(3, "0")}`;
}

type WhisperSegment = { start: number; end: number; text: string };

function isReadyVtt(vtt: string) {
  return vtt.startsWith("WEBVTT") && /\d{2}:\d{2}:\d{2}\.\d{3}\s+-->/.test(vtt);
}

/**
 * Keep Whisper timestamps as the source of truth (no global lead/skew).
 * Only extend short cues toward the next cue so text doesn't flicker away.
 */
async function segmentsToBahasaVtt(segments: WhisperSegment[]) {
  const translated = await withLiveTranslate(() =>
    translateManyToBahasa(segments.map((s) => s.text.trim())),
  );
  const lines = ["WEBVTT", ""];
  let cueIndex = 0;

  for (let i = 0; i < segments.length; i++) {
    const text = (translated[i] || "").replace(/\s+/g, " ").trim();
    if (!text) continue;

    const seg = segments[i];
    const next = segments.slice(i + 1).find((s, j) => (translated[i + 1 + j] || "").trim());
    let start = Math.max(0, seg.start);
    let end = Math.max(start + 0.45, seg.end);

    // Hold text until the next cue when the gap is small (feels more natural).
    if (next) {
      const gap = next.start - end;
      if (gap > 0 && gap < 1.1) {
        end = Math.max(end, next.start - 0.05);
      } else {
        end = Math.min(end + 0.35, next.start - 0.05);
      }
    } else {
      end += 0.5;
    }

    if (!(end > start)) continue;
    cueIndex += 1;
    lines.push(String(cueIndex));
    lines.push(`${toVttTime(start)} --> ${toVttTime(end)}`);
    lines.push(text);
    lines.push("");
  }
  return lines.join("\n");
}

function parseVttToSegments(vtt: string): WhisperSegment[] {
  const body = vtt.replace(/^\uFEFF?WEBVTT[^\n]*\n/, "");
  const blocks = body.split(/\n\s*\n/);
  const out: WhisperSegment[] = [];
  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((l) => l.trimEnd())
      .filter((l) => l.length > 0);
    if (!lines.length || lines[0].startsWith("NOTE")) continue;
    let idx = 0;
    if (lines[0] && !lines[0].includes("-->")) idx = 1;
    const timing = lines[idx];
    if (!timing?.includes("-->")) continue;
    const [startRaw, endRaw] = timing.split("-->").map((s) => s.trim().split(/\s+/)[0]);
    const start = parseClock(startRaw || "");
    const end = parseClock(endRaw || "");
    const text = lines
      .slice(idx + 1)
      .join(" ")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (text && end > start) out.push({ start, end, text });
  }
  return out;
}

function parseClock(raw: string) {
  const parts = raw.trim().split(":");
  if (parts.length < 2) return 0;
  const hours = parts.length === 3 ? Number(parts[0]) : 0;
  const minutes = Number(parts.length === 3 ? parts[1] : parts[0]);
  const secParts = (parts.length === 3 ? parts[2] : parts[1]).split(".");
  const seconds = Number(secParts[0] || 0);
  const millis = Number((secParts[1] || "0").padEnd(3, "0").slice(0, 3));
  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

async function extractAudio(streamUrl: string, wavPath: string) {
  const result = await run(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-fflags",
      "+genpts+discardcorrupt",
      "-i",
      streamUrl,
      "-vn",
      "-af",
      "aresample=async=1:first_pts=0",
      "-ac",
      "1",
      "-ar",
      "16000",
      "-t",
      "150",
      "-start_at_zero",
      "-avoid_negative_ts",
      "make_zero",
      wavPath,
    ],
    90000,
  );
  const fs = await import("fs");
  if (result.code !== 0 || !fs.existsSync(wavPath)) {
    throw new Error(result.stderr || "ffmpeg gagal ekstrak audio");
  }
}

async function transcribe(wavPath: string, workDir: string): Promise<WhisperSegment[]> {
  const path = await import("path");
  const fs = await import("fs");
  const result = await run(
    whisperBin,
    [
      wavPath,
      "--model",
      "tiny.en",
      "--language",
      "en",
      "--task",
      "transcribe",
      "--output_format",
      "json",
      "--output_dir",
      workDir,
      "--verbose",
      "False",
    ],
    180000,
  );
  if (result.code !== 0) {
    throw new Error(result.stderr || "whisper gagal");
  }
  const base = path.basename(wavPath, path.extname(wavPath));
  const jsonPath = path.join(workDir, `${base}.json`);
  if (!fs.existsSync(jsonPath)) {
    throw new Error("whisper tidak menghasilkan json");
  }
  const payload = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as {
    segments?: { start?: number; end?: number; text?: string }[];
  };
  return (payload.segments || [])
    .map((s) => ({
      start: Number(s.start || 0),
      end: Number(s.end || 0),
      text: String(s.text || "").trim(),
    }))
    .filter((s) => s.text && s.end > s.start);
}

async function resolveMediaPlaylist(streamUrl: string): Promise<string> {
  const res = await fetch(streamUrl, {
    headers: { "User-Agent": "Mozilla/5.0 AuraDracin/1.0" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`gagal load playlist (${res.status})`);
  const text = await res.text();
  if (!text.includes("#EXTINF")) {
    // Master playlist — pick the last (usually highest) or prefer ld/540.
    const variants = [...text.matchAll(/#EXT-X-STREAM-INF:[^\n]*\n([^\n]+)/g)].map((m) =>
      m[1].trim(),
    );
    const prefer =
      variants.find((u) => /ld|540|960/i.test(u)) ||
      variants[0];
    if (!prefer) throw new Error("playlist kosong");
    return new URL(prefer, streamUrl).toString();
  }
  return streamUrl;
}

/** Download & concatenate MPEG-TS segments (short dramas fit Workers memory). */
async function fetchMpegTsBlob(streamUrl: string, maxSeconds = 150): Promise<Uint8Array> {
  const mediaUrl = await resolveMediaPlaylist(streamUrl);
  const res = await fetch(mediaUrl, {
    headers: { "User-Agent": "Mozilla/5.0 AuraDracin/1.0" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`gagal load media playlist (${res.status})`);
  const text = await res.text();
  const lines = text.split(/\r?\n/);
  const segmentUrls: string[] = [];
  let duration = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("#EXTINF:")) {
      duration += Number(line.slice(8).split(",")[0]) || 5;
      const next = lines[i + 1]?.trim();
      if (next && !next.startsWith("#")) {
        segmentUrls.push(new URL(next, mediaUrl).toString());
      }
      if (duration >= maxSeconds) break;
    }
  }
  if (!segmentUrls.length) throw new Error("tidak ada segmen video");

  const chunks: Uint8Array[] = [];
  // Keep concurrency modest for CDN friendliness.
  for (let i = 0; i < segmentUrls.length; i += 4) {
    const batch = segmentUrls.slice(i, i + 4);
    const parts = await Promise.all(
      batch.map(async (url) => {
        const r = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 AuraDracin/1.0" },
          signal: AbortSignal.timeout(20000),
        });
        if (!r.ok) throw new Error(`segmen gagal (${r.status})`);
        return new Uint8Array(await r.arrayBuffer());
      }),
    );
    chunks.push(...parts);
  }

  let total = 0;
  for (const c of chunks) total += c.byteLength;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

async function generateViaWorkersAi(
  env: CloudflareBindings,
  streamUrl: string,
): Promise<string | null> {
  if (!env.AI || !env.MEDIA) return null;

  const mpegts = await fetchMpegTsBlob(streamUrl, 150);
  const audioBlob = new Blob([mpegts.buffer.slice(mpegts.byteOffset, mpegts.byteOffset + mpegts.byteLength) as ArrayBuffer], {
    type: "video/mp2t",
  });
  const audioRes = await env
    .MEDIA!.input(audioBlob.stream())
    .output({ mode: "audio", time: "0s", duration: "150s" })
    .response();
  if (!audioRes.ok) {
    throw new Error(`MEDIA audio gagal (${audioRes.status})`);
  }
  const audioBytes = new Uint8Array(await audioRes.arrayBuffer());
  if (audioBytes.byteLength < 1000) {
    throw new Error("audio hasil ekstraksi terlalu kecil");
  }

  const whisper = (await env.AI.run("@cf/openai/whisper", {
    audio: [...audioBytes],
  })) as {
    text?: string;
    vtt?: string;
    words?: { word?: string; start?: number; end?: number }[];
  };

  let segments: WhisperSegment[] = [];
  if (whisper.vtt && isReadyVtt(whisper.vtt)) {
    segments = parseVttToSegments(whisper.vtt);
  } else if (Array.isArray(whisper.words) && whisper.words.length) {
    // Group words into ~short cues.
    let buf: WhisperSegment | null = null;
    for (const w of whisper.words) {
      const word = String(w.word || "").trim();
      if (!word) continue;
      const start = Number(w.start || 0);
      const end = Math.max(start + 0.2, Number(w.end || start + 0.3));
      if (!buf) {
        buf = { start, end, text: word };
        continue;
      }
      const gap = start - buf.end;
      if (gap > 0.55 || buf.text.length > 42) {
        segments.push(buf);
        buf = { start, end, text: word };
      } else {
        buf.end = end;
        buf.text = `${buf.text} ${word}`.trim();
      }
    }
    if (buf) segments.push(buf);
  } else if (whisper.text?.trim()) {
    segments = [{ start: 0.2, end: 4, text: whisper.text.trim() }];
  }

  if (!segments.length) return null;
  return segmentsToBahasaVtt(segments);
}

const inflight = new Map<string, Promise<string>>();

export async function getBahasaSubtitles(opts: {
  provider: string;
  dramaId: string;
  episode: number;
  streamUrl: string;
}): Promise<{ vtt: string; cached: boolean; status?: string }> {
  const id = cacheId(opts.provider, opts.dramaId, opts.episode);
  const cached = await dbFirst<{ vtt: string; status: string }>(
    `SELECT vtt, status FROM subtitle_cache WHERE id = ?`,
    id,
  );
  // Serve successful caches. status=error rows fall through and retry.
  if (cached?.status === "ready" && isReadyVtt(cached.vtt)) {
    return { vtt: cached.vtt, cached: true, status: "ready" };
  }

  const existing = inflight.get(id);
  if (existing) {
    const vtt = await existing;
    return { vtt, cached: false, status: isReadyVtt(vtt) ? "ready" : "pending" };
  }

  const cfEnv = await getCloudflareEnv();
  const canWorkersAi = Boolean(cfEnv?.AI && cfEnv?.MEDIA);
  const canLocal = subtitlesGenerationEnabled();

  if (!canWorkersAi && !canLocal) {
    const note =
      cached?.vtt?.startsWith("WEBVTT")
        ? cached.vtt
        : "WEBVTT\n\nNOTE\nSubtitle Bahasa sedang disiapkan…\n";
    return { vtt: note, cached: Boolean(cached), status: "unavailable" };
  }

  const job = (async () => {
    await dbRun(
      `INSERT OR REPLACE INTO subtitle_cache (id, provider, drama_id, episode, stream_url, vtt, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'generating', datetime('now'))`,
      id,
      opts.provider,
      opts.dramaId,
      opts.episode,
      opts.streamUrl,
      "WEBVTT\n\nNOTE\nSubtitle Bahasa sedang dibuat…\n",
    );

    try {
      let vtt: string | null = null;

      if (canWorkersAi && cfEnv) {
        vtt = await generateViaWorkersAi(cfEnv, opts.streamUrl);
      }

      if (!vtt && canLocal) {
        const fs = await import("fs");
        const path = await import("path");
        const dataDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "subtitles");
        fs.mkdirSync(dataDir, { recursive: true });
        const workDir = path.join(dataDir, id);
        fs.mkdirSync(workDir, { recursive: true });
        const wavPath = path.join(workDir, "audio.wav");
        try {
          await extractAudio(opts.streamUrl, wavPath);
          const segments = await transcribe(wavPath, workDir);
          vtt =
            segments.length > 0
              ? await segmentsToBahasaVtt(segments)
              : "WEBVTT\n\nNOTE\nSubtitle Bahasa belum tersedia untuk episode ini.\n";
        } finally {
          try {
            fs.rmSync(wavPath, { force: true });
          } catch {
            /* ignore */
          }
        }
      }

      if (!vtt || !isReadyVtt(vtt)) {
        throw new Error("gagal membuat subtitle Bahasa");
      }

      await dbRun(
        `INSERT OR REPLACE INTO subtitle_cache (id, provider, drama_id, episode, stream_url, vtt, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'ready', datetime('now'))`,
        id,
        opts.provider,
        opts.dramaId,
        opts.episode,
        opts.streamUrl,
        vtt,
      );
      return vtt;
    } catch (error) {
      const message = error instanceof Error ? error.message : "subtitle gagal";
      const fallback = `WEBVTT\n\nNOTE\n${message}\n`;
      await dbRun(
        `INSERT OR REPLACE INTO subtitle_cache (id, provider, drama_id, episode, stream_url, vtt, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'error', datetime('now'))`,
        id,
        opts.provider,
        opts.dramaId,
        opts.episode,
        opts.streamUrl,
        fallback,
      );
      return fallback;
    } finally {
      inflight.delete(id);
    }
  })();

  inflight.set(id, job);

  // On Workers, don't block the HTTP response for the full Whisper job —
  // return a pending NOTE and finish via waitUntil when possible.
  if (process.env.CLOUDFLARE_WORKERS === "1") {
    void runInBackground(async () => {
      await job;
    });
    return {
      vtt: "WEBVTT\n\nNOTE\nSubtitle Bahasa sedang dibuat…\n",
      cached: false,
      status: "generating",
    };
  }

  const vtt = await job;
  return { vtt, cached: false, status: isReadyVtt(vtt) ? "ready" : "error" };
}
