import { createHash } from "crypto";
import { dbFirst, dbRun } from "./db";

function hashKey(text: string) {
  return createHash("sha256").update(text.trim().toLowerCase()).digest("hex").slice(0, 32);
}

/** Heuristic: skip titles that already look Indonesian. */
export function looksEnglish(text: string) {
  const t = text.trim();
  if (!t) return false;
  if (
    /\b(yang|dengan|dari|untuk|adalah|ternyata|sang|aku|dia|pada|seorang|cinta|bos|mantan|suami|istri|keluarga)\b/i.test(
      t,
    )
  ) {
    return false;
  }
  if (/\b(the|and|of|to|you|your|love|my|her|his|been|from|with|for|baby|king|queen|alpha|luna|cowboy|genie|wolf)\b/i.test(t)) {
    return true;
  }
  // Latin-only titles from EN catalogs
  return /^[\x00-\x7F]+$/.test(t) && /[A-Za-z]{3,}/.test(t) && /\s/.test(t);
}

async function translateViaGoogle(text: string): Promise<string | null> {
  const url =
    "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=" +
    encodeURIComponent(text);
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 AuraDracin/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
  return data[0]
    .map((chunk: unknown) => (Array.isArray(chunk) ? String(chunk[0] || "") : ""))
    .join("")
    .trim();
}

export async function translateToBahasa(text: string): Promise<string> {
  const source = text.trim();
  if (!source || !looksEnglish(source)) return source;

  const key = hashKey(source);
  const cached = await dbFirst<{ translated: string }>(
    `SELECT translated FROM translation_cache WHERE id = ?`,
    key,
  );
  if (cached?.translated) return cached.translated;

  // Skip live Google fan-out on Workers (subrequest/CPU budget); use English until cached.
  if (process.env.CLOUDFLARE_WORKERS === "1") {
    return source;
  }

  try {
    const translated = (await translateViaGoogle(source)) || source;
    await dbRun(
      `INSERT OR REPLACE INTO translation_cache (id, source, translated, updated_at)
       VALUES (?, ?, ?, datetime('now'))`,
      key,
      source,
      translated,
    );
    return translated;
  } catch {
    return source;
  }
}

export async function translateManyToBahasa(texts: string[]): Promise<string[]> {
  const out: string[] = [];
  // Small concurrency to stay polite with the free endpoint
  const queue = [...texts.entries()];
  const workers = Array.from({ length: Math.min(4, queue.length || 1) }, async () => {
    while (queue.length) {
      const next = queue.shift();
      if (!next) break;
      const [index, text] = next;
      out[index] = await translateToBahasa(text);
    }
  });
  await Promise.all(workers);
  return out;
}
