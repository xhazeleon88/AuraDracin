import { createHash } from "crypto";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { getDb } from "./db";
import { translateToBahasa } from "./translate";

const whisperBin = process.env.WHISPER_BIN || "/home/ubuntu/.local/bin/whisper";
const dataDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "subtitles");

function cacheId(provider: string, dramaId: string, episode: number) {
  return createHash("sha256")
    .update(`${provider}:${dramaId}:${episode}`)
    .digest("hex")
    .slice(0, 32);
}

function run(cmd: string, args: string[], timeoutMs = 180000): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
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

async function segmentsToBahasaVtt(segments: WhisperSegment[]) {
  const lines = ["WEBVTT", ""];
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const text = (await translateToBahasa(seg.text.trim())).replace(/\s+/g, " ").trim();
    if (!text) continue;
    lines.push(String(i + 1));
    lines.push(`${toVttTime(seg.start)} --> ${toVttTime(seg.end)}`);
    lines.push(text);
    lines.push("");
  }
  return lines.join("\n");
}

async function extractAudio(streamUrl: string, wavPath: string) {
  // Cap at 4 minutes — enough for most short-drama episodes.
  const result = await run(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-i",
      streamUrl,
      "-t",
      "240",
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      wavPath,
    ],
    120000,
  );
  if (result.code !== 0 || !fs.existsSync(wavPath)) {
    throw new Error(result.stderr || "ffmpeg gagal ekstrak audio");
  }
}

async function transcribe(wavPath: string, workDir: string): Promise<WhisperSegment[]> {
  const result = await run(
    whisperBin,
    [
      wavPath,
      "--model",
      "tiny",
      "--language",
      "English",
      "--task",
      "transcribe",
      "--output_format",
      "json",
      "--output_dir",
      workDir,
      "--fp16",
      "False",
    ],
    240000,
  );
  if (result.code !== 0) {
    throw new Error(result.stderr || "whisper gagal");
  }
  const base = path.basename(wavPath, path.extname(wavPath));
  const jsonPath = path.join(workDir, `${base}.json`);
  if (!fs.existsSync(jsonPath)) {
    throw new Error("whisper output tidak ditemukan");
  }
  const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as {
    segments?: WhisperSegment[];
  };
  return (parsed.segments || [])
    .map((s) => ({
      start: Number(s.start) || 0,
      end: Number(s.end) || 0,
      text: String(s.text || "").trim(),
    }))
    .filter((s) => s.text && s.end > s.start);
}

const inflight = new Map<string, Promise<string>>();

export async function getBahasaSubtitles(opts: {
  provider: string;
  dramaId: string;
  episode: number;
  streamUrl: string;
}): Promise<{ vtt: string; cached: boolean }> {
  const id = cacheId(opts.provider, opts.dramaId, opts.episode);
  const db = getDb();
  const cached = db
    .prepare(`SELECT vtt, status FROM subtitle_cache WHERE id = ?`)
    .get(id) as { vtt: string; status: string } | undefined;
  if (cached?.status === "ready" && cached.vtt.startsWith("WEBVTT")) {
    return { vtt: cached.vtt, cached: true };
  }

  const existing = inflight.get(id);
  if (existing) {
    const vtt = await existing;
    return { vtt, cached: false };
  }

  const job = (async () => {
    fs.mkdirSync(dataDir, { recursive: true });
    const workDir = path.join(dataDir, id);
    fs.mkdirSync(workDir, { recursive: true });
    const wavPath = path.join(workDir, "audio.wav");

    db.prepare(
      `INSERT OR REPLACE INTO subtitle_cache (id, provider, drama_id, episode, stream_url, vtt, status, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'generating', datetime('now'))`,
    ).run(id, opts.provider, opts.dramaId, opts.episode, opts.streamUrl, "WEBVTT\n\n");

    try {
      await extractAudio(opts.streamUrl, wavPath);
      const segments = await transcribe(wavPath, workDir);
      const vtt =
        segments.length > 0
          ? await segmentsToBahasaVtt(segments)
          : "WEBVTT\n\nNOTE\nSubtitle Bahasa belum tersedia untuk episode ini.\n";

      db.prepare(
        `INSERT OR REPLACE INTO subtitle_cache (id, provider, drama_id, episode, stream_url, vtt, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'ready', datetime('now'))`,
      ).run(id, opts.provider, opts.dramaId, opts.episode, opts.streamUrl, vtt);
      return vtt;
    } catch (error) {
      const message = error instanceof Error ? error.message : "subtitle gagal";
      const fallback = `WEBVTT\n\nNOTE\n${message}\n`;
      db.prepare(
        `INSERT OR REPLACE INTO subtitle_cache (id, provider, drama_id, episode, stream_url, vtt, status, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'error', datetime('now'))`,
      ).run(id, opts.provider, opts.dramaId, opts.episode, opts.streamUrl, fallback);
      return fallback;
    } finally {
      inflight.delete(id);
      try {
        fs.rmSync(wavPath, { force: true });
      } catch {
        /* ignore */
      }
    }
  })();

  inflight.set(id, job);
  const vtt = await job;
  return { vtt, cached: false };
}
