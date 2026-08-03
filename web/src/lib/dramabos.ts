import {
  DEMO_FEED,
  genreDemo,
  getDemoDetail,
  getDemoStream,
  searchDemo,
} from "./demo-dramabos";
import type { DramaCard, DramaDetail, StreamResult } from "./types";

const BASE = process.env.DRAMABOS_BASE_URL || "https://prod-api.dramabos.live";
const LANG = process.env.DRAMABOS_LANG || "id";
const DEFAULT_PROVIDER = process.env.DRAMABOS_DEFAULT_PROVIDER || "starshort";

export type DramabosStatus = {
  mode: "live" | "demo";
  reason?: string;
  provider: string;
};

function apiKey() {
  return process.env.DRAMABOS_API_KEY?.trim() || "";
}

async function dramabosFetch(path: string): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const key = apiKey();
  if (!key) {
    return { ok: false, error: "DRAMABOS_API_KEY belum di-set" };
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        "User-Agent": "Mozilla/5.0 AuraDracin/1.0",
        Accept: "application/json",
      },
      next: { revalidate: 120 },
    });

    if (!res.ok) {
      return { ok: false, error: `DramaBos HTTP ${res.status}` };
    }

    const data = await res.json();
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Gagal konek ke DramaBos API",
    };
  }
}

function asArray(input: unknown): Record<string, unknown>[] {
  if (Array.isArray(input)) return input as Record<string, unknown>[];
  if (!input || typeof input !== "object") return [];
  const obj = input as Record<string, unknown>;
  for (const key of ["data", "list", "items", "records", "result", "books", "dramas"]) {
    if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
  }
  if (obj.data && typeof obj.data === "object") {
    const nested = obj.data as Record<string, unknown>;
    for (const key of ["list", "items", "records", "books"]) {
      if (Array.isArray(nested[key])) return nested[key] as Record<string, unknown>[];
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
  const id = pickString(row, [
    "id",
    "bookId",
    "dramaId",
    "code",
    "book_id",
    "drama_id",
    "videoId",
  ]);
  const title = pickString(row, ["title", "bookName", "name", "dramaName", "book_name"]);
  const cover = pickString(row, [
    "cover",
    "coverWap",
    "coverUrl",
    "poster",
    "thumbnail",
    "pic",
    "image",
  ]);
  if (!id || !title) return null;

  return {
    id,
    provider,
    title,
    cover: cover || "/assets/thumbs/v1.jpg",
    synopsis: pickString(row, ["synopsis", "introduction", "desc", "description", "intro"]),
    episodeCount: pickNumber(row, ["episodeCount", "chapterCount", "totalEpisode", "eps", "episodes"]),
    category: pickString(row, ["genre", "category", "tag", "classifyName"]) || "romance",
    likes: pickNumber(row, ["likeCount", "likes", "hot", "playCount"]),
    source: "dramabos",
  };
}

function normalizeCards(data: unknown, provider: string): DramaCard[] {
  return asArray(data)
    .map((row) => normalizeCard(row, provider))
    .filter((row): row is DramaCard => Boolean(row));
}

export async function getStatus(): Promise<DramabosStatus> {
  if (!apiKey()) {
    return {
      mode: "demo",
      reason: "Set DRAMABOS_API_KEY di .env buat tarik video live dari DramaBos.",
      provider: DEFAULT_PROVIDER,
    };
  }
  const probe = await dramabosFetch(`/${DEFAULT_PROVIDER}/api/v1/trending?lang=${LANG}&page=1`);
  if (!probe.ok) {
    return {
      mode: "demo",
      reason: probe.error || "DramaBos API tidak bisa diakses, pakai katalog demo.",
      provider: DEFAULT_PROVIDER,
    };
  }
  return { mode: "live", provider: DEFAULT_PROVIDER };
}

export async function getTrending(provider = DEFAULT_PROVIDER, page = 1): Promise<DramaCard[]> {
  const paths = [
    `/${provider}/api/v1/trending?lang=${LANG}&page=${page}`,
    `/${provider}/api/v1/popular?lang=${LANG}&page=${page}`,
    `/${provider}/api/v1/home?lang=${LANG}&page=${page}`,
    `/${provider}/api/v1/discover?lang=${LANG}&page=${page}`,
  ];

  for (const path of paths) {
    const res = await dramabosFetch(path);
    if (!res.ok) continue;
    const cards = normalizeCards(res.data, provider);
    if (cards.length) return cards;
  }

  return DEMO_FEED;
}

export async function getLatest(provider = DEFAULT_PROVIDER, page = 1): Promise<DramaCard[]> {
  const paths = [
    `/${provider}/api/v1/home?lang=${LANG}&page=${page}`,
    `/${provider}/api/v1/foryou?lang=${LANG}&page=${page}`,
    `/${provider}/api/v1/trending?lang=${LANG}&page=${page}`,
  ];

  for (const path of paths) {
    const res = await dramabosFetch(path);
    if (!res.ok) continue;
    const cards = normalizeCards(res.data, provider);
    if (cards.length) return cards;
  }

  return [...DEMO_FEED].reverse();
}

export async function searchDramas(
  q: string,
  provider = DEFAULT_PROVIDER,
): Promise<DramaCard[]> {
  if (!q.trim()) return getTrending(provider);

  const encoded = encodeURIComponent(q.trim());
  const paths =
    provider === "dramabox"
      ? [`/${provider}/api/v1/search?keyword=${encoded}&lang=${LANG}`]
      : provider === "idrama"
        ? [`/${provider}/search?q=${encoded}&lang=${LANG}`]
        : provider === "flickreels"
          ? [`/${provider}/api/flickreels/search?q=${encoded}&lang=${LANG}`]
          : [`/${provider}/api/v1/search?q=${encoded}&lang=${LANG}`];

  for (const path of paths) {
    const res = await dramabosFetch(path);
    if (!res.ok) continue;
    const cards = normalizeCards(res.data, provider);
    if (cards.length) return cards;
  }

  return searchDemo(q);
}

export async function getByGenre(
  type: string,
  provider = "dramabite",
  page = 1,
): Promise<DramaCard[]> {
  const encoded = encodeURIComponent(type);
  const paths = [
    `/${provider}/api/v1/genre?type=${encoded}&lang=${LANG}&page=${page}`,
    `/${provider}/api/v1/classify?genre=${encoded}&lang=${LANG}&page=${page}`,
    `/${provider}/api/v1/category?type=${encoded}&lang=${LANG}&page=${page}`,
  ];

  for (const path of paths) {
    const res = await dramabosFetch(path);
    if (!res.ok) continue;
    const cards = normalizeCards(res.data, provider);
    if (cards.length) return cards;
  }

  return genreDemo(type);
}

export async function getDramaDetail(
  provider: string,
  id: string,
): Promise<DramaDetail | null> {
  const paths =
    provider === "flickreels"
      ? [`/${provider}/api/flickreels/detail?id=${encodeURIComponent(id)}&lang=${LANG}`]
      : provider === "idrama"
        ? [`/${provider}/drama/${encodeURIComponent(id)}?lang=${LANG}`]
        : provider === "shortmax"
          ? [`/${provider}/api/v1/detail/${encodeURIComponent(id)}?lang=${LANG}`]
          : [`/${provider}/api/v1/detail/${encodeURIComponent(id)}?lang=${LANG}`];

  for (const path of paths) {
    const res = await dramabosFetch(path);
    if (!res.ok || !res.data) continue;
    const root = res.data as Record<string, unknown>;
    const row =
      root.data && typeof root.data === "object" && !Array.isArray(root.data)
        ? (root.data as Record<string, unknown>)
        : root;
    const base = normalizeCard(row, provider);
    if (!base) continue;

    const episodeRows = asArray(
      row.episodes || row.chapterList || row.list || root.episodes || root.data,
    );
    const episodes = episodeRows
      .map((ep, index) => {
        const number =
          pickNumber(ep, ["number", "index", "chapterIndex", "ep", "sort"]) ?? index + 1;
        return {
          id: pickString(ep, ["id", "chapterId", "episodeId"]) || `${base.id}-ep-${number}`,
          number,
          title: pickString(ep, ["title", "name", "chapterName"]) || `Episode ${number}`,
          thumbnail: pickString(ep, ["cover", "thumbnail", "pic"]) || base.cover,
          locked: Boolean(ep.lock || ep.locked || ep.isLock),
        };
      })
      .sort((a, b) => a.number - b.number);

    return {
      ...base,
      synopsis: base.synopsis || pickString(row, ["introduction", "synopsis", "desc"]),
      episodes:
        episodes.length > 0
          ? episodes
          : Array.from({ length: base.episodeCount || 12 }, (_, i) => ({
              id: `${base.id}-ep-${i + 1}`,
              number: i + 1,
              title: `Episode ${i + 1}`,
              thumbnail: base.cover,
            })),
      hashtags: [provider, "dracin", String(base.category || "romance")],
    };
  }

  return getDemoDetail(provider, id);
}

export async function getStream(
  provider: string,
  id: string,
  ep = 1,
): Promise<StreamResult | null> {
  const paths =
    provider === "flickreels"
      ? [`/${provider}/api/flickreels/episode?id=${encodeURIComponent(id)}&ep=${ep}&lang=${LANG}`]
      : provider === "idrama"
        ? [`/${provider}/unlock/${encodeURIComponent(id)}/${ep}?lang=${LANG}`]
      : provider === "shortmax"
        ? [`/${provider}/api/v1/play/${encodeURIComponent(id)}?ep=${ep}&lang=${LANG}`]
      : provider === "dramabox"
        ? [`/${provider}/api/v1/download/${encodeURIComponent(id)}?ep=${ep}&lang=${LANG}`]
        : [`/${provider}/api/v1/play/${encodeURIComponent(id)}/${ep}?lang=${LANG}`];

  for (const path of paths) {
    const res = await dramabosFetch(path);
    if (!res.ok || !res.data) continue;
    const root = res.data as Record<string, unknown>;
    const row =
      root.data && typeof root.data === "object" && !Array.isArray(root.data)
        ? (root.data as Record<string, unknown>)
        : root;

    const url = pickString(row, [
      "url",
      "playUrl",
      "play_url",
      "m3u8",
      "streamUrl",
      "videoUrl",
      "cdnUrl",
    ]);

    if (!url) {
      const qualities = asArray(row.quality || row.qualities || row.list);
      for (const q of qualities) {
        const qUrl = pickString(q, ["url", "playUrl", "m3u8", "path"]);
        if (qUrl) {
          return {
            url: qUrl,
            quality: pickString(q, ["quality", "name", "resolution"]) || undefined,
            type: qUrl.includes(".m3u8") ? "hls" : "mp4",
          };
        }
      }
      continue;
    }

    return {
      url,
      quality: pickString(row, ["quality", "resolution"]) || undefined,
      type: url.includes(".m3u8") ? "hls" : "mp4",
    };
  }

  return getDemoStream(provider, id, ep);
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
