import { createHash } from "crypto";
import { dbAll, dbFirst, dbRun } from "./db";

function hashKey(text: string) {
  return createHash("sha256").update(text.trim().toLowerCase()).digest("hex").slice(0, 32);
}

/** When true, Workers may call Google Translate (homepage warm / miss fill). */
let liveTranslateAllowed = false;

export async function withLiveTranslate<T>(fn: () => Promise<T>): Promise<T> {
  liveTranslateAllowed = true;
  try {
    return await fn();
  } finally {
    liveTranslateAllowed = false;
  }
}

/** Heuristic: skip titles that already look Indonesian. */
export function looksEnglish(text: string) {
  const t = text.trim();
  if (!t) return false;
  if (
    /\b(yang|dengan|dari|untuk|adalah|ternyata|sang|aku|dia|pada|seorang|cinta|bos|mantan|suami|istri|keluarga|rahasia|warisan|balas|dendam)\b/i.test(
      t,
    )
  ) {
    return false;
  }
  if (
    /\b(the|and|of|to|you|your|love|my|her|his|been|from|with|for|baby|king|queen|alpha|luna|cowboy|genie|wolf|billionaire|heiress|replaced|trapped|stolen|first|true)\b/i.test(
      t,
    )
  ) {
    return true;
  }
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
  const out = data[0]
    .map((chunk: unknown) => (Array.isArray(chunk) ? String(chunk[0] || "") : ""))
    .join("")
    .trim();
  return out || null;
}

function isUsefulTranslation(source: string, translated: string) {
  const s = source.trim();
  const t = translated.trim();
  if (!t) return false;
  // Never treat identical English as a successful Bahasa translation.
  if (t.toLowerCase() === s.toLowerCase() && looksEnglish(s)) return false;
  return true;
}

export async function translateToBahasa(text: string): Promise<string> {
  const source = text.trim();
  if (!source || !looksEnglish(source)) return source;

  const key = hashKey(source);
  const cached = await dbFirst<{ translated: string }>(
    `SELECT translated FROM translation_cache WHERE id = ?`,
    key,
  );
  if (cached?.translated && isUsefulTranslation(source, cached.translated)) {
    return cached.translated;
  }

  // Request path on Workers: serve D1 only unless warm/miss-fill enabled.
  if (process.env.CLOUDFLARE_WORKERS === "1" && !liveTranslateAllowed) {
    return source;
  }

  try {
    const translated = await translateViaGoogle(source);
    if (!translated || !isUsefulTranslation(source, translated)) {
      // Do not poison D1 with English identity rows — allow a later retry.
      return source;
    }
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
  // Keep concurrency low so Google's free endpoint doesn't fail open to English.
  const queue = [...texts.entries()];
  const workers = Array.from({ length: Math.min(2, queue.length || 1) }, async () => {
    while (queue.length) {
      const next = queue.shift();
      if (!next) break;
      const [index, text] = next;
      out[index] = await translateToBahasa(text);
      // Small pause between calls during warm fills.
      if (liveTranslateAllowed) {
        await new Promise((r) => setTimeout(r, 80));
      }
    }
  });
  await Promise.all(workers);
  return out;
}

/** Remove poisoned rows where English was stored as its own "translation". */
export async function purgeIdentityTranslations() {
  const rows = await dbAll<{ id: string; source: string; translated: string }>(
    `SELECT id, source, translated FROM translation_cache`,
  );
  let removed = 0;
  for (const row of rows) {
    if (!isUsefulTranslation(row.source, row.translated)) {
      await dbRun(`DELETE FROM translation_cache WHERE id = ?`, row.id);
      removed += 1;
    }
  }
  return removed;
}
