import { translateToBahasa } from "./translate";
import { toDramaTitleCase } from "./titleCase";
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
  fundrama: "https://drakula.goodbos.online",
  microdrama: "https://drakula.goodbos.online",
  vigloo: "https://drakula.goodbos.online",
  freereels: "https://drakula.goodbos.online",
  shortmax: "https://shortmax.goodbos.online",
  dramabox: "https://dramabox.goodbos.online",
  flickreels: "https://flickreels.goodbos.online",
  dramabite: "https://dramabite.goodbos.online",
  idrama: "https://idrama.goodbos.online",
  flareflow: "https://flareflow.goodbos.online",
  pinedrama: "https://pinedrama.goodbos.online",
  golddrama: "https://golddrama.goodbos.online",
  melolo: "https://melolo.goodbos.online",
  netshort: "https://netshort.goodbos.online",
  dramawave: "https://dramawave.goodbos.online",
  happyshort: "https://happyshort.goodbos.online",
};

/** Providers we actively pull homepage/search catalogs from. */
export const CATALOG_PROVIDERS = [
  "reelshort",
  "goodshort",
  "dramabite",
  "pinedrama",
  "golddrama",
  "flickreels",
  "idrama",
  "netshort",
  "dramawave",
  "melolo",
  "starshort",
  "fundrama",
  "microdrama",
  "vigloo",
  "freereels",
  "shortmax",
  "dramabox",
  "flareflow",
  "happyshort",
] as const;

/** Featured studio rails — always target ~25 live titles each on the homepage. */
export const FEATURED_STUDIO_PROVIDERS = ["reelshort", "goodshort"] as const;

const HOME_PAGE_SIZE = 40;

const DRAKULA_PROVIDERS = new Set([
  "starshort",
  "fundrama",
  "microdrama",
  "vigloo",
  "freereels",
]);

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

function providerBase(provider: string) {
  const host = hostFor(provider);
  // Drakula-hosted apps expose the stable surface under /api/{provider}/...
  if (DRAKULA_PROVIDERS.has(provider)) return `${host}/api/${provider}`;
  return host;
}

function feedLang(provider: string) {
  if (provider === "reelshort" || DRAKULA_PROVIDERS.has(provider)) return "en";
  return LANG === "id" ? "in" : LANG;
}

/** Parse API counters that may be numbers or abbreviated strings ("1.2K", "3M"). */
function parseCount(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value));
  if (typeof value !== "string") return undefined;
  const raw = value.trim().replace(/,/g, "");
  if (!raw) return undefined;
  const m = raw.match(/^(\d+(?:\.\d+)?)([kKmMbB])?$/);
  if (!m) {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : undefined;
  }
  const base = Number(m[1]);
  const suffix = (m[2] || "").toLowerCase();
  const mult = suffix === "k" ? 1_000 : suffix === "m" ? 1_000_000 : suffix === "b" ? 1_000_000_000 : 1;
  return Math.max(0, Math.round(base * mult));
}

async function fetchJson(
  url: string,
  opts?: { timeoutMs?: number; revalidate?: number | false },
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  try {
    const timeoutMs = opts?.timeoutMs ?? 12_000;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 AuraDracin/1.0",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(timeoutMs),
      ...(opts?.revalidate === false
        ? { cache: "no-store" as const }
        : { next: { revalidate: opts?.revalidate ?? 120 } }),
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
    "collections",
    "payloads",
    "hot_drama_list",
    "searchCodeSearchResult",
  ]) {
    if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
  }
  if (obj.data && typeof obj.data === "object") {
    const nested = obj.data as Record<string, unknown>;
    for (const key of [
      "list",
      "items",
      "records",
      "books",
      "searchResult",
      "episodes",
      "results",
      "payloads",
      "data",
      "searchCodeSearchResult",
      "hot_drama_list",
      "collections",
    ]) {
      if (Array.isArray(nested[key])) return nested[key] as Record<string, unknown>[];
      // GoodShort search: data.searchResult.records
      if (nested[key] && typeof nested[key] === "object") {
        const deeper = nested[key] as Record<string, unknown>;
        if (Array.isArray(deeper.records)) return deeper.records as Record<string, unknown>[];
      }
    }
    if (nested.book && typeof nested.book === "object") {
      return [nested.book as Record<string, unknown>];
    }
    // freereels: data.data.items[].series
    if (nested.data && typeof nested.data === "object") {
      const deeper = nested.data as Record<string, unknown>;
      if (Array.isArray(deeper.items)) {
        return (deeper.items as Record<string, unknown>[]).map((row) =>
          row.series && typeof row.series === "object"
            ? (row.series as Record<string, unknown>)
            : row,
        );
      }
      if (Array.isArray(deeper.data)) return deeper.data as Record<string, unknown>[];
    }
  }
  return [];
}

function pickString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value
        .replace(/<[^>]+>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
    if (typeof value === "number") return String(value);
  }
  return "";
}

function pickNumber(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const parsed = parseCount(row[key]);
    if (typeof parsed === "number") return parsed;
  }
  return undefined;
}

function pickCover(row: Record<string, unknown>) {
  const direct = pickString(row, [
    "pic",
    "cover",
    "cover2",
    "image",
    "bookDetailCover",
    "thumbnailExpanded",
    "thumbnail",
    "cover_image",
    "cover_url",
    "compress_cover_url",
    "shortPlayCover",
    "bannerImage",
    "ptear", // fundrama obfuscated cover
  ]);
  if (direct) return direct;

  const coverThumb =
    row.cover_image_thumb && typeof row.cover_image_thumb === "object"
      ? pickString(row.cover_image_thumb as Record<string, unknown>, ["thumb", "url"])
      : "";
  if (coverThumb) return coverThumb;

  if (Array.isArray(row.thumbnails)) {
    for (const thumb of row.thumbnails) {
      if (thumb && typeof thumb === "object") {
        const url = pickString(thumb as Record<string, unknown>, ["url", "src", "image"]);
        if (url) return url;
      } else if (typeof thumb === "string" && thumb.trim()) {
        return thumb.trim();
      }
    }
  }

  return "";
}

function normalizeCard(
  row: Record<string, unknown>,
  provider: string,
  opts: { requireCover?: boolean } = {},
): DramaCard | null {
  const requireCover = opts.requireCover !== false;

  // Nested wrappers (freereels/flickreels variants)
  if (row.series && typeof row.series === "object") {
    return normalizeCard(row.series as Record<string, unknown>, provider, opts);
  }
  if (row.program && typeof row.program === "object") {
    return normalizeCard(row.program as Record<string, unknown>, provider, opts);
  }
  if (row.info && typeof row.info === "object") {
    return normalizeCard(row.info as Record<string, unknown>, provider, opts);
  }

  // GoodShort home items expose bookId (real drama id) and a separate list id
  const id =
    provider === "goodshort"
      ? pickString(row, ["bookId", "action", "id", "dramaId"])
      : pickString(row, [
          "id",
          "bookId",
          "action",
          "dramaId",
          "shortplay_id",
          "shortPlayId",
          "collection_id",
          "playlet_id",
          "file_id",
          "key",
          "dshame", // fundrama obfuscated id
        ]);
  // Do NOT use `tags` as title — GoodShort /hot returns hot-words with tags=title and no cover.
  const title = pickString(row, [
    "title",
    "bookName",
    "name",
    "shortPlayName",
    "short_play_name",
    "nsin", // fundrama obfuscated title
  ]);
  const cover = pickCover(row);
  if (!id || !title) return null;
  // Catalog cards without artwork look broken — skip incomplete rows (e.g. hot-words).
  if (requireCover && !cover) return null;
  return {
    id,
    provider,
    title,
    cover,
    synopsis: pickString(row, [
      "desc",
      "introduction",
      "synopsis",
      "description",
      "introduce",
      "logLine",
      "dentra", // fundrama obfuscated synopsis
    ]),
    episodeCount: pickNumber(row, [
      "chapters",
      "chapterCount",
      "episodes",
      "totalEpisodes",
      "total_episodes",
      "episodeCount",
      "episode_count",
      "upload_num",
      "eshe",
    ]),
    category: pickString(row, ["genre", "category", "label", "categories", "series_tag"]) || "romance",
    likes: pickNumber(row, [
      "likeCount",
      "likeNum",
      "likes",
      "praiseCount",
      "favor_count",
      "follow_count",
      "followCount",
      "bookmarkCount",
      "collect_count",
      "heatScore",
      "scoreShow",
      "hot_score",
      "hot",
    ]),
    views: pickNumber(row, [
      "viewCount",
      "view_count",
      "views",
      "view",
      "playCount",
      "play_count",
      "watchCount",
      "watch_count",
    ]),
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

async function localizeCard(card: DramaCard): Promise<DramaCard> {
  // Catalog rails only show titles — skip synopsis translate to keep feeds fast.
  const title = toDramaTitleCase(await translateToBahasa(card.title));
  return { ...card, title };
}

async function localizeCards(cards: DramaCard[]): Promise<DramaCard[]> {
  const out: DramaCard[] = new Array(cards.length);
  const queue = [...cards.entries()];
  await Promise.all(
    Array.from({ length: Math.min(10, queue.length || 1) }, async () => {
      while (queue.length) {
        const next = queue.shift();
        if (!next) break;
        const [index, card] = next;
        out[index] = await localizeCard(card);
      }
    }),
  );
  return out;
}

async function localizeDetail(detail: DramaDetail): Promise<DramaDetail> {
  const base = await localizeCard(detail);
  const episodes = await Promise.all(
    detail.episodes.map(async (ep) => ({
      ...ep,
      title: toDramaTitleCase(await translateToBahasa(ep.title)),
    })),
  );
  return { ...detail, ...base, episodes };
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
  const base = providerBase(provider);
  const lang = feedLang(provider);
  let paths: string[] = [];
  if (provider === "starshort") {
    paths = [
      withCode(`${base}/content/trending?locale=${lang}`),
      withCode(`${base}/content/hot?locale=${lang}`),
      withCode(`${base}/content/latest?locale=${lang}`),
      withCode(`${base}/content/recommended?locale=${lang}`),
      withCode(`${base}/search?keyword=love+story&locale=${lang}`),
    ];
  } else if (provider === "freereels") {
    paths = [
      withCode(`${base}/popular?lang=${lang}`),
      withCode(`${base}/foryou?lang=${lang}`),
      withCode(`${base}/new?lang=${lang}`),
      withCode(`${base}/search?q=love+story&lang=${lang}`),
    ];
  } else if (provider === "vigloo") {
    paths = [
      withCode(`${base}/search?q=love`),
      withCode(`${base}/rank`),
      withCode(`${base}/browse`),
    ];
  } else if (provider === "fundrama" || provider === "microdrama") {
    paths = [
      withCode(`${base}/dramas`),
      withCode(`${base}/list`),
      withCode(`${base}/search?q=love+story`),
      withCode(`${base}/search?q=love`),
    ];
  } else {
    // Prefer full catalog endpoints (with covers) over /hot word lists.
    paths = [
      withCode(`${base}/home?lang=${lang}&channelId=-1&page=${page}&size=${HOME_PAGE_SIZE}`),
      withCode(`${base}/trending?lang=${lang}`),
      withCode(`${base}/api/trending?lang=${lang}`),
      withCode(`${base}/popular?lang=${lang}`),
      withCode(`${base}/list?lang=${lang}`),
      withCode(`${base}/api/list?lang=${lang}&page=${page}`),
      withCode(`${base}/api/search?q=love+story&lang=${lang}&page=${page}`),
      withCode(`${base}/search?q=love+story&lang=${lang}&page=${page}`),
      withCode(`${base}/search?keyword=love&lang=${lang}&page=${page}`),
      withCode(`${base}/hot?lang=${lang}`),
    ];
  }

  for (const path of paths) {
    const res = await fetchJson(path);
    if (!res.ok) continue;
    const cards = normalizeCards(res.data, provider);
    if (cards.length) return localizeCards(cards);
  }

  return [];
}

export async function getLatest(provider = DEFAULT_PROVIDER, page = 1): Promise<DramaCard[]> {
  const base = providerBase(provider);
  const lang = feedLang(provider);
  const paths = [
    withCode(`${base}/home?lang=${lang}&channelId=563&page=${page}&size=${HOME_PAGE_SIZE}`),
    withCode(`${base}/home?lang=${lang}&channelId=-1&page=${page}&size=${HOME_PAGE_SIZE}`),
    withCode(`${base}/api/list?lang=${lang}&page=${page}`),
    withCode(`${base}/nexthome?page=${page}&page_size=${HOME_PAGE_SIZE}&lang=${lang}`),
    withCode(`${base}/api/search?q=new&lang=${lang}&page=${page}`),
    withCode(`${base}/search?q=new&lang=${lang}&page=${page}`),
    withCode(`${base}/search?keyword=new&lang=${lang}&page=${page}`),
  ];
  for (const path of paths) {
    const res = await fetchJson(path);
    if (!res.ok) continue;
    const cards = normalizeCards(res.data, provider);
    if (cards.length) return localizeCards(cards);
  }
  return getTrending(provider, page);
}

/**
 * Build a studio rail from live API only (no local/demo seeds).
 * Featured studios (ReelShort / GoodShort) always pull multiple feed pages +
 * thematic searches until we have a full ~25-title rail. Larger limits (studio
 * pages) use the same multi-source fill for every provider.
 */
export async function getProviderRail(provider: string, limit = 25): Promise<DramaCard[]> {
  const featured = (FEATURED_STUDIO_PROVIDERS as readonly string[]).includes(provider);
  const aggressive = featured || limit > 25;

  if (!aggressive) {
    const [trend, latest] = await Promise.all([
      getTrending(provider, 1).catch(() => [] as DramaCard[]),
      getLatest(provider, 1).catch(() => [] as DramaCard[]),
    ]);
    return dedupe([...trend, ...latest]).slice(0, Math.max(1, limit));
  }

  const pages = featured ? [1, 2, 3] : [1, 2];
  const queries = featured
    ? ["love story", "ceo billionaire", "revenge", "baby family", "romance love", "contract wife"]
    : ["love story", "ceo billionaire", "romance love"];

  const feedJobs = pages.flatMap((page) => [
    getTrending(provider, page).catch(() => [] as DramaCard[]),
    getLatest(provider, page).catch(() => [] as DramaCard[]),
  ]);
  const searchJobs = queries.map((q) => searchDramas(q, provider).catch(() => [] as DramaCard[]));

  const batches = await Promise.all([...feedJobs, ...searchJobs]);
  return dedupe(batches.flat()).slice(0, Math.max(1, limit));
}

function interleaveBatches(batches: DramaCard[][]): DramaCard[] {
  const out: DramaCard[] = [];
  const max = Math.max(0, ...batches.map((b) => b.length));
  for (let i = 0; i < max; i += 1) {
    for (const batch of batches) {
      if (batch[i]) out.push(batch[i]);
    }
  }
  return dedupe(out);
}

/** Pull as many live titles as possible from every working provider. */
export async function getHomepageCatalog(limit = 120): Promise<DramaCard[]> {
  const status = await getProviderStatus();
  const liveIds = new Set(
    (status.platforms || [])
      .filter((p) => p.status === "active" || p.status === "maintenance")
      .map((p) => p.id.toLowerCase()),
  );
  const providers = CATALOG_PROVIDERS.filter(
    (id) =>
      liveIds.size === 0 ||
      liveIds.has(id) ||
      ["reelshort", "goodshort", "fundrama", "microdrama", "vigloo", "freereels"].includes(id),
  );

  const queries = ["love", "ceo", "revenge", "baby"];

  const batches = await Promise.all(
    providers.map(async (provider) => {
      const [trend, latest, ...searches] = await Promise.all([
        getTrending(provider, 1).catch(() => [] as DramaCard[]),
        getLatest(provider, 1).catch(() => [] as DramaCard[]),
        ...queries
          .slice(0, provider === "reelshort" || provider === "goodshort" ? queries.length : 2)
          .map((q) => searchDramas(q, provider).catch(() => [] as DramaCard[])),
      ]);
      return dedupe([...trend, ...latest, ...searches.flat()]);
    }),
  );

  return interleaveBatches(batches).slice(0, limit);
}

/** Providers that usually return usable search hits quickly. */
export const SEARCH_PROVIDERS = [
  "reelshort",
  "goodshort",
  "netshort",
  "dramawave",
  "pinedrama",
  "golddrama",
  "idrama",
  "flickreels",
  "vigloo",
  "freereels",
  "starshort",
  "microdrama",
  "fundrama",
  "dramabite",
] as const;

/** Expand Indonesian / slang queries into English API-friendly terms. */
export function expandSearchQueries(raw: string): string[] {
  const q = raw.trim().replace(/\s+/g, " ");
  if (!q) return [];
  const lower = q.toLowerCase();
  const extras: string[] = [];

  // Phrases first (before single-word rules like "cinta" → "love").
  const phrases: [RegExp, string[]][] = [
    [/\bcinta\s+pertama\b/i, ["first love"]],
    [/\bbalas\s*dendam\b/i, ["revenge", "payback"]],
    [/\bkontrak\s+(nikah|istri|suami)\b/i, ["contract wife", "contract marriage"]],
    [/\bcinta\s+terlarang\b/i, ["forbidden love"]],
    [/\bmantan\s+(suami|istri|pacar)?\b/i, ["ex husband", "ex wife", "ex love"]],
    [/\bkuli\s+bangunan\b/i, ["construction worker", "heir"]],
    [/\bsang\s+pewaris\b/i, ["heir", "hidden heir"]],
    [/\bmiliarder\b/i, ["billionaire"]],
  ];

  const words: [RegExp, string[]][] = [
    [/\b(ceo|bos|pebisnis|konglomerat)\b/i, ["ceo", "billionaire", "boss"]],
    [/\b(fantasi|werewolf|serigala|alpha|luna)\b/i, ["fantasy", "werewolf", "alpha"]],
    [/\b(cinta|romance|romansa)\b/i, ["love", "romance"]],
    [/\b(nikah|kontrak|istri|suami)\b/i, ["marriage", "contract wife"]],
    [/\b(bayi|anak|family|keluarga)\b/i, ["baby", "family"]],
    [/\b(misteri|thriller|horor)\b/i, ["mystery", "thriller"]],
    [/\b(komedi|lucu)\b/i, ["comedy"]],
    [/\b(aksi|action)\b/i, ["action"]],
    [/\b(pertama)\b/i, ["first"]],
  ];

  for (const [re, terms] of phrases) {
    if (re.test(lower)) extras.push(...terms);
  }
  for (const [re, terms] of words) {
    if (re.test(lower)) extras.push(...terms);
  }

  // Prefer English expansions first so provider APIs get searchable terms.
  const english = extras.filter((t) => /^[\x00-\x7F]+$/.test(t));
  const out = [...english, q, ...extras];
  if (!q.includes(" ") && english[0]) out.push(`${q} ${english[0]}`);
  else if (!q.includes(" ")) out.push(`${q} drama`);

  return [...new Set(out.map((s) => s.trim()).filter(Boolean))].slice(0, 8);
}

function relevanceScore(card: DramaCard, query: string, expansions: string[]): number {
  const title = `${card.title} ${card.synopsis || ""}`.toLowerCase();
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter((t) => t.length > 1);
  let score = 0;

  if (title.includes(q)) score += 140;
  for (const tok of tokens) {
    if (title.includes(tok)) score += 32;
  }
  for (const exp of expansions) {
    const e = exp.toLowerCase();
    if (!e || e === q) continue;
    if (title.includes(e)) score += 48;
    for (const tok of e.split(/\s+/)) {
      if (tok.length > 2 && title.includes(tok)) score += 10;
    }
  }

  // Mild popularity boost so decent matches float up
  score += Math.min(25, Math.log10((card.likes || 1) + 1) * 8);
  score += Math.min(15, Math.log10((card.views || 1) + 1) * 3);
  return score;
}

async function searchProviderFast(provider: string, query: string): Promise<DramaCard[]> {
  const base = providerBase(provider);
  const lang = feedLang(provider);
  const encoded = encodeURIComponent(query);
  const timeoutMs = 2800;

  const paths =
    provider === "starshort"
      ? [withCode(`${base}/search?keyword=${encoded}&locale=${lang}`)]
      : provider === "freereels"
        ? [
            withCode(
              `${base}/search?q=${encodeURIComponent(query.includes(" ") ? query : `${query} drama`)}&lang=${lang}`,
            ),
          ]
        : provider === "goodshort"
          ? [
              withCode(
                `${base}/search?q=${encodeURIComponent(query.includes(" ") ? query : `${query} love`)}&lang=in`,
              ),
              withCode(`${base}/search?q=${encoded}&lang=in`),
            ]
          : provider === "vigloo"
            ? [withCode(`${base}/search?q=${encoded}`)]
            : provider === "fundrama" || provider === "microdrama"
              ? [
                  withCode(`${base}/search?q=${encodeURIComponent(query.includes(" ") ? query : `${query} love`)}`),
                  withCode(`${base}/search?q=${encoded}`),
                ]
              : [
                  withCode(`${base}/search?q=${encoded}&lang=${lang}`),
                  withCode(`${base}/api/search?q=${encoded}&lang=${lang}`),
                  withCode(`${base}/search?keyword=${encoded}&lang=${lang}`),
                ];

  for (const path of paths.slice(0, 2)) {
    const res = await fetchJson(path, { timeoutMs, revalidate: 60 });
    if (!res.ok) continue;
    const cards = normalizeCards(res.data, provider);
    if (cards.length) return cards;
  }
  return [];
}

/**
 * Multi-provider search with ID→EN expansion, then Bahasa re-rank so queries
 * like "cinta pertama" match translated titles as well as English API hits.
 */
export async function searchCatalog(q: string, limit = 60): Promise<DramaCard[]> {
  const query = q.trim();
  if (!query) return [];

  const expansions = expandSearchQueries(query);
  const ascii = expansions.filter((x) => /^[\x00-\x7F]+$/.test(x));
  // Hit APIs with English terms first; keep original for ID-native catalogs.
  const queries = [...new Set([...ascii.slice(0, 3), query])].slice(0, 4);

  const batches = await Promise.all(
    SEARCH_PROVIDERS.map(async (provider) => {
      const perQuery = await Promise.all(
        queries.map((term) => searchProviderFast(provider, term).catch(() => [] as DramaCard[])),
      );
      return dedupe(perQuery.flat());
    }),
  );

  const merged = dedupe(batches.flat());
  // Pre-rank on English API titles, keep a wider pool, then localize & re-rank
  // so Bahasa titles (e.g. "… Cinta Pertama") can match Indonesian queries.
  const preRanked = merged
    .map((card) => ({ card, score: relevanceScore(card, query, expansions) }))
    .sort((a, b) => b.score - a.score || (b.card.likes || 0) - (a.card.likes || 0))
    .map((row) => row.card)
    .slice(0, Math.max(limit * 3, 120));

  const localized = await localizeCards(preRanked);
  const qLower = query.toLowerCase();

  return localized
    .map((card, index) => {
      const english = preRanked[index];
      // Keep the best of English API title + Bahasa title so ID queries still
      // benefit from expansions like "cinta pertama" → "first love".
      let score = Math.max(
        relevanceScore(english, query, expansions),
        relevanceScore(card, query, expansions),
      );
      const idTitle = card.title.toLowerCase();
      if (idTitle.includes(qLower)) score += 260;
      if (expansions.some((e) => e.toLowerCase() !== qLower && idTitle.includes(e.toLowerCase()))) {
        score += 80;
      }
      // Prefer known-good studios for watchability.
      if (card.provider === "reelshort" || card.provider === "goodshort") score += 18;
      return { card, score };
    })
    .sort((a, b) => b.score - a.score || (b.card.likes || 0) - (a.card.likes || 0))
    .map((row) => row.card)
    .filter((card, _index, arr) => {
      const english = preRanked.find((c) => c.provider === card.provider && c.id === card.id);
      const score = Math.max(
        relevanceScore(english || card, query, expansions),
        relevanceScore(card, query, expansions),
      );
      if (card.title.toLowerCase().includes(qLower)) return true;
      if (score >= 28) return true;
      if (arr.length < 12) return score >= 8;
      return false;
    })
    .slice(0, limit);
}

/** Search API */
export async function searchDramas(q: string, provider = DEFAULT_PROVIDER): Promise<DramaCard[]> {
  if (!q.trim()) return getTrending(provider);
  if (!provider || provider === "all") return searchCatalog(q);
  const expansions = expandSearchQueries(q);
  const apiQuery =
    expansions.find((x) => /^[\x00-\x7F]+$/.test(x)) || expansions[0] || q.trim();
  const cards = await searchProviderFast(provider, apiQuery);
  return localizeCards(cards);
}

/** Prefer studios whose /drama/[provider]/[id] pages actually resolve. */
export const FEATURED_SAFE_PROVIDERS = ["reelshort", "goodshort"] as const;

/** Always pin these titles at the front of Unggulan (replacing the last slot). */
export const FEATURED_PINNED: { provider: string; id: string }[] = [
  { provider: "reelshort", id: "6a469b12d3f5c65f7f095b8a" },
];

/** Build Unggulan slides: pinned first, then safe high-engagement titles. */
export async function buildFeaturedSlides(
  catalog: DramaCard[],
  limit = 5,
): Promise<DramaCard[]> {
  const pinned: DramaCard[] = [];
  for (const ref of FEATURED_PINNED) {
    const fromCatalog = catalog.find((c) => c.provider === ref.provider && c.id === ref.id);
    if (fromCatalog) {
      pinned.push(fromCatalog);
      continue;
    }
    const detail = await getDramaDetail(ref.provider, ref.id).catch(() => null);
    if (detail) {
      // Leave likes/views raw here — page runs mergeLocalLikes so Unggulan
      // matches the watch-page engagement numbers.
      pinned.push({
        id: detail.id,
        provider: detail.provider,
        title: detail.title,
        cover: detail.cover,
        synopsis: detail.synopsis,
        episodeCount: detail.episodeCount,
        category: detail.category,
        likes: detail.likes,
        views: detail.views,
        source: "dramabos",
      });
    }
  }

  const pinnedKeys = new Set(pinned.map((c) => `${c.provider}:${c.id}`));
  const safe = new Set<string>(FEATURED_SAFE_PROVIDERS);
  const pool = catalog.filter(
    (c) => safe.has(c.provider) && !pinnedKeys.has(`${c.provider}:${c.id}`),
  );
  const rest = [...pool]
    .sort(
      (a, b) =>
        (b.views || 0) + (b.likes || 0) * 20 - ((a.views || 0) + (a.likes || 0) * 20),
    )
    .slice(0, Math.max(0, limit - pinned.length));

  return dedupe([...pinned, ...rest]).slice(0, limit);
}

/** Genre & Category API */
export async function getByGenre(
  type: string,
  provider = "goodshort",
  page = 1,
): Promise<DramaCard[]> {
  const base = providerBase(provider);
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
  const lang = feedLang(provider);

  const paths = [
    withCode(`${base}/search?q=${encodeURIComponent(q)}&lang=${lang}&page=${page}`),
    withCode(`${base}/search?keyword=${encodeURIComponent(q)}&lang=${lang}&page=${page}`),
    withCode(`${base}/api/search?q=${encodeURIComponent(q)}&lang=${lang}&page=${page}`),
    withCode(`${base}/hot?lang=${lang}`),
    `${base}/search?q=${encodeURIComponent(q)}&lang=en&page=${page}`,
  ];

  for (const path of paths) {
    const res = await fetchJson(path);
    if (!res.ok) continue;
    const cards = normalizeCards(res.data, provider);
    if (cards.length) return localizeCards(cards);
  }

  void encoded;
  return [];
}

/** Drama API + Episode API */
export async function getDramaDetail(
  provider: string,
  id: string,
): Promise<DramaDetail | null> {
  const host = hostFor(provider);
  const basePath = providerBase(provider);

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
      const base = normalizeCard(book, provider, { requireCover: false });
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

        return localizeDetail({
          ...base,
          synopsis: base.synopsis || pickString(book, ["introduction", "desc"]) || "",
          episodes: normalizedEps,
          hashtags: ["dracin", provider, String(base.category || "romance")],
        });
      }
    }
  } else {
    const lang = feedLang(provider);
    const detailPaths = [
      `${basePath}/detail/${encodeURIComponent(id)}?lang=${lang}`,
      withCode(`${basePath}/detail/${encodeURIComponent(id)}?lang=${lang}`),
      withCode(`${basePath}/drama/${encodeURIComponent(id)}?lang=${lang}`),
      withCode(`${basePath}/book/${encodeURIComponent(id)}?lang=${lang}`),
      `${host}/detail/${encodeURIComponent(id)}?lang=${lang}`,
    ];
    const chapterPaths = [
      withCode(`${basePath}/chapters/${encodeURIComponent(id)}?lang=${lang}`),
      withCode(`${host}/chapters/${encodeURIComponent(id)}?lang=${lang}`),
      withCode(`${basePath}/drama/${encodeURIComponent(id)}?lang=${lang}`),
    ];

    let detailRes: { ok: boolean; data?: unknown } = { ok: false };
    for (const path of detailPaths) {
      detailRes = await fetchJson(path);
      if (detailRes.ok && detailRes.data) break;
    }

    let chapterRes: { ok: boolean; data?: unknown } = { ok: false };
    for (const path of chapterPaths) {
      chapterRes = await fetchJson(path);
      if (chapterRes.ok && chapterRes.data) break;
    }

    if (detailRes.ok && detailRes.data) {
      const row = detailRes.data as Record<string, unknown>;
      const nested =
        row.data && typeof row.data === "object"
          ? (row.data as Record<string, unknown>)
          : row;
      const base =
        normalizeCard(nested, provider, { requireCover: false }) ||
        normalizeCard(row, provider, { requireCover: false });
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

        return localizeDetail({
          ...base,
          synopsis: base.synopsis || pickString(nested, ["desc", "introduction", "description"]),
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
        });
      }
    }
  }

  return null;
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
