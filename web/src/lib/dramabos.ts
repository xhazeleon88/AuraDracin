import {
  DEMO_FEED,
  genreDemo,
  getDemoDetail,
  getDemoStream,
  searchDemo,
} from "./demo-dramabos";
import type { DramaCard, DramaDetail, StreamResult } from "./types";

/**
 * DramaBuzz / DramaBos-compatible client.
 *
 * Gateway status: https://api.dramabuzz.sbs/api/status?key=ACCESS_CODE
 * Provider hosts:  https://{provider}.goodbos.online/...
 *
 * Covers docs categories:
 * Search · Drama · Episode · Streaming · Feed/Trending · Genre · Provider Status · Download/CDN
 */

const GATEWAY = process.env.DRAMABOS_BASE_URL || "https://api.dramabuzz.sbs";
const LANG = process.env.DRAMABOS_LANG || "id";
const DEFAULT_PROVIDER = process.env.DRAMABOS_DEFAULT_PROVIDER || "reelshort";

const PROVIDER_HOST: Record<string, string> = {
  reelshort: "https://reelshort.goodbos.online",
  goodshort: "https://goodshort.goodbos.online",
  starshort: "https://drakula.goodbos.online",
  shortmax: "https://shortmax.goodbos.online",
  dramabox: "https://dramabox.goodbos.online",
  flickreels: "https://flickreels.goodbos.online",
  dramabite: "https://dramabite.goodbos.online",
  idrama: "https://idrama.goodbos.online",
};

export type DramabosStatus = {
  mode: "live" | "demo";
  reason?: string;
  provider: string;
  platforms?: { id: string; name: string; status: string; api?: string | null }[];
};

function accessCode() {
  return (
    process.env.DRAMABOS_API_KEY?.trim() ||
    process.env.DRAMABUZZ_ACCESS_CODE?.trim() ||
    ""
  );
}

function hostFor(provider: string) {
  return PROVIDER_HOST[provider] || `https://${provider}.goodbos.online`;
}

async function fetchJson(url: string): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 AuraDracin/1.0",
        Accept: "application/json",
      },
      next: { revalidate: 120 },
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, data: await res.json() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Fetch gagal",
    };
  }
}

function withCode(url: string) {
  const key = accessCode();
  if (!key) return url;
  const join = url.includes("?") ? "&" : "?";
  // GoodBos locked endpoints use `code=`, gateway uses `key=`
  if (url.includes("api.dramabuzz.sbs")) return `${url}${join}key=${encodeURIComponent(key)}`;
  return `${url}${join}code=${encodeURIComponent(key)}`;
}

function asArray(input: unknown): Record<string, unknown>[] {
  if (Array.isArray(input)) return input as Record<string, unknown>[];
  if (!input || typeof input !== "object") return [];
  const obj = input as Record<string, unknown>;
  for (const key of [
    "popular",
    "results",
    "books",
    "list",
    "items",
    "records",
    "episodes",
    "chapters",
    "data",
    "platforms",
  ]) {
    if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
  }
  if (obj.data && typeof obj.data === "object") {
    const nested = obj.data as Record<string, unknown>;
    for (const key of ["list", "items", "records", "books", "searchResult", "episodes"]) {
      if (Array.isArray(nested[key])) return nested[key] as Record<string, unknown>[];
    }
    if (nested.book && typeof nested.book === "object") {
      return [nested.book as Record<string, unknown>];
    }
  }
  return [];
}

function pickString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function pickNumber(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}

function normalizeCard(row: Record<string, unknown>, provider: string): DramaCard | null {
  // GoodShort home items expose bookId (real drama id) and a separate list id
  const id =
    provider === "goodshort"
      ? pickString(row, ["bookId", "action", "id", "dramaId"])
      : pickString(row, ["id", "bookId", "action", "dramaId"]);
  const title = pickString(row, ["title", "bookName", "name", "tags"]);
  const cover = pickString(row, ["pic", "cover", "image", "bookDetailCover", "thumbnail"]);
  if (!id || !title) return null;
  return {
    id,
    provider,
    title,
    cover: cover || "/assets/thumbs/v1.jpg",
    synopsis: pickString(row, ["desc", "introduction", "synopsis", "description"]),
    episodeCount: pickNumber(row, ["chapters", "chapterCount", "episodes", "totalEpisodes"]),
    category: pickString(row, ["genre", "category", "label"]) || "romance",
    likes: pickNumber(row, ["view", "playCount", "likes", "hot"]),
    source: "dramabos",
  };
}

function normalizeCards(data: unknown, provider: string): DramaCard[] {
  // GoodShort home nests items inside records
  if (data && typeof data === "object") {
    const root = data as Record<string, unknown>;
    const payload = (root.data && typeof root.data === "object" ? root.data : root) as Record<
      string,
      unknown
    >;
    if (Array.isArray(payload.records)) {
      const cards: DramaCard[] = [];
      for (const rec of payload.records as Record<string, unknown>[]) {
        for (const item of asArray(rec.items || rec)) {
          const card = normalizeCard(item, provider);
          if (card) cards.push(card);
        }
      }
      if (cards.length) return dedupe(cards);
    }
  }

  return dedupe(
    asArray(data)
      .map((row) => normalizeCard(row, provider))
      .filter((row): row is DramaCard => Boolean(row)),
  );
}

function dedupe(cards: DramaCard[]) {
  const seen = new Set<string>();
  return cards.filter((c) => {
    const key = `${c.provider}:${c.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Provider Status API */
export async function getProviderStatus(): Promise<DramabosStatus> {
  const key = accessCode();
  if (!key) {
    return {
      mode: "demo",
      reason: "Set DRAMABOS_API_KEY (kode akses DramaBuzz) di .env",
      provider: DEFAULT_PROVIDER,
    };
  }

  const res = await fetchJson(`${GATEWAY}/api/status?key=${encodeURIComponent(key)}`);
  if (!res.ok || !res.data || typeof res.data !== "object") {
    return {
      mode: "demo",
      reason: res.error || "DramaBuzz status API gagal",
      provider: DEFAULT_PROVIDER,
    };
  }

  const data = res.data as {
    success?: boolean;
    platforms?: { id: string; name: string; status: string; api?: string | null }[];
  };

  if (!data.success) {
    return {
      mode: "demo",
      reason: "Kode akses DramaBuzz tidak valid",
      provider: DEFAULT_PROVIDER,
    };
  }

  return {
    mode: "live",
    provider: DEFAULT_PROVIDER,
    platforms: data.platforms || [],
  };
}

export async function getStatus(): Promise<DramabosStatus> {
  return getProviderStatus();
}

/** Feed & Trending API */
export async function getTrending(provider = DEFAULT_PROVIDER, page = 1): Promise<DramaCard[]> {
  const host = hostFor(provider);
  const paths =
    provider === "goodshort"
      ? [
          `${host}/home?lang=${LANG === "id" ? "in" : LANG}&channelId=-1&page=${page}&size=24`,
          `${host}/hot?lang=${LANG === "id" ? "in" : LANG}`,
        ]
      : [
          `${host}/trending?lang=${provider === "reelshort" ? "en" : LANG}`,
          `${host}/search?q=love&lang=en&page=${page}`,
        ];

  for (const path of paths) {
    const res = await fetchJson(path);
    if (!res.ok) continue;
    const cards = normalizeCards(res.data, provider);
    if (cards.length) return cards;
  }

  return DEMO_FEED.map((d) => ({ ...d, provider }));
}

export async function getLatest(provider = DEFAULT_PROVIDER, page = 1): Promise<DramaCard[]> {
  const host = hostFor(provider);
  if (provider === "goodshort") {
    const res = await fetchJson(
      `${host}/home?lang=${LANG === "id" ? "in" : LANG}&channelId=563&page=${page}&size=24`,
    );
    if (res.ok) {
      const cards = normalizeCards(res.data, provider);
      if (cards.length) return cards;
    }
  }
  return getTrending(provider, page);
}

/** Combined ~50 card feed from ReelShort + GoodShort */
export async function getHomepageCatalog(limit = 50): Promise<DramaCard[]> {
  const per = Math.ceil(limit / 2);
  const queries = ["love", "ceo", "revenge", "baby", "billionaire", "wife"];

  const [rsTrend, gsHome, gsHot, ...rsSearches] = await Promise.all([
    getTrending("reelshort"),
    getTrending("goodshort", 1),
    getLatest("goodshort", 1),
    ...queries.map(async (q) => searchDramas(q, "reelshort")),
  ]);

  const gsPage2 = await getTrending("goodshort", 2);

  const reelshort = dedupe([...rsTrend, ...rsSearches.flat()]).slice(0, per);
  const goodshort = dedupe([...gsHome, ...gsHot, ...gsPage2]).slice(0, per);

  return dedupe([...reelshort, ...goodshort]).slice(0, limit);
}

/** Search API */
export async function searchDramas(q: string, provider = DEFAULT_PROVIDER): Promise<DramaCard[]> {
  if (!q.trim()) return getTrending(provider);
  const host = hostFor(provider);
  const encoded = encodeURIComponent(q.trim());

  const paths =
    provider === "goodshort"
      ? [
          withCode(`${host}/search?keyword=${encoded}&lang=${LANG === "id" ? "in" : LANG}`),
          withCode(`${host}/search?q=${encoded}&lang=${LANG === "id" ? "in" : LANG}`),
        ]
      : [`${host}/search?q=${encoded}&lang=en`];

  for (const path of paths) {
    const res = await fetchJson(path);
    if (!res.ok) continue;
    const cards = normalizeCards(res.data, provider);
    if (cards.length) return cards;
  }

  return searchDemo(q).map((d) => ({ ...d, provider }));
}

/** Genre & Category API */
export async function getByGenre(
  type: string,
  provider = "goodshort",
  page = 1,
): Promise<DramaCard[]> {
  const host = hostFor(provider);
  const encoded = encodeURIComponent(type);

  // Map Aura categories to search/genre queries
  const queryMap: Record<string, string> = {
    romance: "romance love",
    revenge: "revenge",
    "balas-dendam": "revenge",
    ceo: "ceo billionaire",
    fantasy: "fantasy werewolf",
    fantasi: "fantasy",
    comedy: "comedy",
    komedi: "comedy",
    family: "family baby",
    keluarga: "family",
    action: "action",
    aksi: "action",
    thriller: "thriller mystery",
    misteri: "mystery",
  };
  const q = queryMap[type] || type;

  if (provider === "goodshort") {
    // channel -1 trending often returns mixed genres; use search with 2+ words
    const res = await fetchJson(
      withCode(`${host}/search?q=${encodeURIComponent(q)}&lang=in&page=${page}`),
    );
    if (res.ok) {
      const cards = normalizeCards(res.data, provider);
      if (cards.length) return cards;
    }
    const hot = await getTrending("goodshort", page);
    return hot.filter((c) =>
      `${c.title} ${c.synopsis} ${c.category}`.toLowerCase().includes(type.toLowerCase().slice(0, 4)),
    );
  }

  const res = await fetchJson(`${host}/search?q=${encodeURIComponent(q)}&lang=en&page=${page}`);
  if (res.ok) {
    const cards = normalizeCards(res.data, provider);
    if (cards.length) return cards;
  }

  // unused encoded kept for future genre endpoints
  void encoded;
  return genreDemo(type).map((d) => ({ ...d, provider }));
}

/** Drama API + Episode API */
export async function getDramaDetail(
  provider: string,
  id: string,
): Promise<DramaDetail | null> {
  const host = hostFor(provider);

  if (provider === "goodshort") {
    const detailRes = await fetchJson(`${host}/book/${encodeURIComponent(id)}?lang=${LANG === "id" ? "in" : LANG}`);
    const chapterRes = await fetchJson(
      withCode(`${host}/chapters/${encodeURIComponent(id)}?lang=${LANG === "id" ? "in" : LANG}`),
    );

    if (detailRes.ok && detailRes.data) {
      const root = detailRes.data as Record<string, unknown>;
      const book =
        root.data && typeof root.data === "object"
          ? ((root.data as Record<string, unknown>).book as Record<string, unknown>) ||
            (root.data as Record<string, unknown>)
          : root;
      const base = normalizeCard(book, provider);
      if (base) {
        const normalizedEps = asArray(chapterRes.data).map((ep, index) => {
          const idx = pickNumber(ep, ["index"]);
          const number = typeof idx === "number" ? idx + 1 : index + 1;
          return {
            id: pickString(ep, ["id"]) || `${base.id}-ep-${number}`,
            number,
            title: pickString(ep, ["chapterName", "name"]) || `Episode ${number}`,
            thumbnail: pickString(ep, ["image", "cover"]) || base.cover,
            locked: Boolean(Number(ep.price || 0) > 0),
          };
        });

        return {
          ...base,
          synopsis: base.synopsis || pickString(book, ["introduction", "desc"]) || "",
          episodes: normalizedEps,
          hashtags: ["dracin", provider, String(base.category || "romance")],
        };
      }
    }
  } else {
    const detailRes = await fetchJson(
      `${host}/detail/${encodeURIComponent(id)}?lang=${provider === "reelshort" ? "en" : LANG}`,
    );
    const chapterRes = await fetchJson(
      withCode(
        `${host}/chapters/${encodeURIComponent(id)}?lang=${provider === "reelshort" ? "en" : LANG}`,
      ),
    );

    if (detailRes.ok && detailRes.data) {
      const row = detailRes.data as Record<string, unknown>;
      const base = normalizeCard(row, provider);
      if (base) {
        const chapterRows = asArray(
          (chapterRes.data as Record<string, unknown> | undefined)?.chapters || chapterRes.data,
        );
        const episodes = chapterRows.map((ep, index) => ({
          id: pickString(ep, ["id"]) || `${base.id}-ep-${index + 1}`,
          number: index + 1,
          title: pickString(ep, ["name", "title"]) || `Episode ${index + 1}`,
          thumbnail: base.cover,
          locked: Boolean(ep.is_lock),
        }));

        return {
          ...base,
          synopsis: base.synopsis || pickString(row, ["desc", "introduction"]),
          episodes:
            episodes.length > 0
              ? episodes
              : Array.from({ length: base.episodeCount || 12 }, (_, i) => ({
                  id: `${base.id}-ep-${i + 1}`,
                  number: i + 1,
                  title: `Episode ${i + 1}`,
                  thumbnail: base.cover,
                })),
          hashtags: ["dracin", provider, String(base.category || "romance")],
        };
      }
    }
  }

  return getDemoDetail(provider, id);
}

/** Streaming API + Download/CDN API */
export async function getStream(
  provider: string,
  id: string,
  ep = 1,
): Promise<StreamResult | null> {
  const host = hostFor(provider);
  const key = accessCode();

  if (provider === "goodshort") {
    // Prefer /hls/{chapterId} playlists from batchload — they embed AES-128
    // keys as data: URIs. Raw acfs1 playlists use local://offline-key which
    // browsers cannot decrypt.
    const batch = await fetchJson(
      withCode(`${host}/batchload/${encodeURIComponent(id)}?lang=${LANG === "id" ? "in" : LANG}`),
    );
    if (batch.ok) {
      const payload =
        batch.data && typeof batch.data === "object"
          ? ((batch.data as Record<string, unknown>).data as Record<string, unknown>) ||
            (batch.data as Record<string, unknown>)
          : {};
      const episodes = asArray(payload.episodes || payload);
      const target =
        episodes.find((row) => (pickNumber(row, ["index"]) ?? -1) + 1 === ep) ||
        episodes[ep - 1];
      if (target) {
        const videos = asArray(target.videos || target.allVideos || target.multiVideos);
        const best =
          videos.find((v) => pickString(v, ["type", "quality"]).includes("720")) ||
          videos.find((v) => pickString(v, ["type", "quality"]).includes("540")) ||
          videos[0];
        const url = pickString(best || target, ["filePath", "rawUrl", "url", "cdn"]);
        if (url && url.includes("goodbos.online/hls/")) {
          return {
            url,
            quality: pickString(best || {}, ["type", "quality"]) || undefined,
            type: "hls",
          };
        }
        if (
          url &&
          !url.includes("v2-akm.goodreels.com") &&
          !url.includes("v3-akm.goodreels.com") &&
          !url.includes("local://")
        ) {
          return {
            url,
            quality: pickString(best || {}, ["type", "quality"]) || undefined,
            type: url.includes(".m3u8") ? "hls" : "mp4",
          };
        }
      }
    }

    // Fallback: rawurl (often encrypted with local:// keys — may not play)
    const raw = await fetchJson(withCode(`${host}/rawurl/${encodeURIComponent(id)}`));
    if (raw.ok) {
      const payload =
        raw.data && typeof raw.data === "object"
          ? ((raw.data as Record<string, unknown>).data as Record<string, unknown>) ||
            (raw.data as Record<string, unknown>)
          : {};
      const episodes = asArray(payload.episodes || payload);
      const target =
        episodes.find((row) => (pickNumber(row, ["index"]) ?? -1) + 1 === ep) ||
        episodes[ep - 1];
      const chapterId = pickString((target || {}) as Record<string, unknown>, ["id"]);
      if (chapterId) {
        return {
          url: `${host}/hls/${encodeURIComponent(chapterId)}?bookId=${encodeURIComponent(id)}&q=720p`,
          quality: "720p",
          type: "hls",
        };
      }
      const videos = asArray(target?.allVideos || target?.videos);
      const best =
        videos.find((v) => pickString(v, ["type", "quality"]).includes("720")) || videos[0];
      const url =
        pickString((best || {}) as Record<string, unknown>, ["rawUrl", "filePath", "url"]) ||
        pickString((target || {}) as Record<string, unknown>, ["m3u8", "cdn", "url"]);
      if (url && !url.includes("v2-akm.goodreels.com") && !url.includes("v3-akm.goodreels.com")) {
        return {
          url,
          quality: pickString((best || {}) as Record<string, unknown>, ["type", "quality"]) || "720p",
          type: url.includes(".m3u8") ? "hls" : "mp4",
        };
      }
    }
  } else {
    // ReelShort: allepisodes returns streams[]
    // Prefer 540p / -ld H.264 — 720p+ is often HEVC (hvc1) which Chrome MSE cannot play.
    const all = await fetchJson(
      withCode(
        `${host}/allepisodes/${encodeURIComponent(id)}?lang=${provider === "reelshort" ? "en" : LANG}`,
      ),
    );
    if (all.ok) {
      const root = all.data as Record<string, unknown> | undefined;
      const nested =
        root && typeof root.data === "object"
          ? (root.data as Record<string, unknown>)
          : root;
      const episodes = asArray(nested?.episodes || all.data);
      const target =
        episodes.find((row) => pickNumber(row, ["episode", "number"]) === ep) || episodes[ep - 1];
      if (target) {
        const streams = asArray(target.streams);
        const best =
          streams.find((s) => {
            const q = pickString(s, ["quality"]);
            const u = pickString(s, ["url", "playUrl", "m3u8"]);
            return q.includes("540") || u.includes("-ld");
          }) ||
          streams.find((s) => pickString(s, ["quality"]).includes("720")) ||
          streams[0] ||
          target;
        const url = pickString(best as Record<string, unknown>, ["url", "playUrl", "m3u8"]);
        if (url) {
          return {
            url,
            quality: pickString(best as Record<string, unknown>, ["quality"]) || undefined,
            type: url.includes(".m3u8") ? "hls" : "mp4",
          };
        }
      }
    }
  }

  void key;
  // Do not fall back to demo cover images as "streams" — that looks like
  // a broken player that only shows thumbnails.
  const demo = getDemoStream(provider, id, ep);
  if (demo.url && !/\.(jpg|jpeg|png|webp)(\?|$)/i.test(demo.url) && !demo.url.startsWith("/assets/")) {
    return demo;
  }
  return null;
}

/** Download & CDN helper used by API route */
export async function getDownloadLinks(provider: string, id: string) {
  const host = hostFor(provider);
  if (provider === "goodshort") {
    const raw = await fetchJson(withCode(`${host}/rawurl/${encodeURIComponent(id)}`));
    return raw.ok ? raw.data : null;
  }
  const all = await fetchJson(
    withCode(`${host}/allepisodes/${encodeURIComponent(id)}?lang=en`),
  );
  return all.ok ? all.data : null;
}

export function genreQueryForCategory(slug: string) {
  const map: Record<string, string> = {
    romance: "romance",
    "balas-dendam": "revenge",
    ceo: "ceo",
    fantasi: "fantasy",
    komedi: "comedy",
    keluarga: "family",
    aksi: "action",
    misteri: "thriller",
  };
  return map[slug] || slug;
}
