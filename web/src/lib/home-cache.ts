import {
  FEATURED_STUDIO_PROVIDERS,
  PLAYABLE_PROVIDERS,
  buildFeaturedSlides,
  getHomepageCatalog,
  getProviderRail,
} from "./dramabos";
import {
  HOME_CACHE_KEY,
  getCloudflareEnv,
  runInBackground,
  type HomeSnapshot,
} from "./cf";
import { mergeLocalLikes } from "./videos";
import { purgeIdentityTranslations, withLiveTranslate } from "./translate";

const MEMORY_TTL_MS = 60_000;
let memorySnap: { expires: number; value: HomeSnapshot } | null = null;

function ttlSec() {
  const n = Number(process.env.HOME_CACHE_TTL_SEC || 120);
  return Number.isFinite(n) && n > 10 ? n : 120;
}

export async function buildHomeSnapshot(): Promise<HomeSnapshot> {
  return withLiveTranslate(async () => {
  const onWorkers = process.env.CLOUDFLARE_WORKERS === "1";
  const homepageProviders = onWorkers
    ? [...FEATURED_STUDIO_PROVIDERS]
    : [...PLAYABLE_PROVIDERS];

  // Keep Workers fan-out tiny: one catalog pull + one rail per featured studio.
  const [catalogRaw, ...providerBatches] = await Promise.all([
    getHomepageCatalog(onWorkers ? 48 : 240),
    ...homepageProviders.map(async (provider) => {
      const items = await getProviderRail(provider, onWorkers ? 16 : 25).catch(() => []);
      return { provider, items: await mergeLocalLikes(items) };
    }),
  ]);

  const catalog = await mergeLocalLikes(catalogRaw);
  const trending = catalog;
  const latest = (
    await mergeLocalLikes(providerBatches.flatMap((batch) => batch.items))
  ).slice(0, onWorkers ? 24 : 36);

  const featuredSet = new Set<string>(FEATURED_STUDIO_PROVIDERS);
  const orderedBatches = [
    ...FEATURED_STUDIO_PROVIDERS.map((provider) =>
      providerBatches.find((batch) => batch.provider === provider),
    ),
    ...providerBatches.filter((batch) => !featuredSet.has(batch.provider)),
  ].filter(Boolean) as typeof providerBatches;

  const providerRails = orderedBatches
    .map((batch) => ({
      provider: batch.provider,
      items: batch.items.slice(0, onWorkers ? 16 : 25),
    }))
    .filter((rail) => rail.items.length > 0);

  const featuredSlides = await mergeLocalLikes(await buildFeaturedSlides(catalog, 5));

  return {
    version: 1,
    builtAt: Date.now(),
    featuredSlides,
    trending: trending.slice(0, onWorkers ? 36 : 60),
    latest,
    providerRails,
  };
  });
}

async function readKvSnapshot(): Promise<HomeSnapshot | null> {
  const env = await getCloudflareEnv();
  const raw = await env?.AURA_CACHE?.get(HOME_CACHE_KEY, "json");
  if (!raw || typeof raw !== "object") return null;
  const snap = raw as HomeSnapshot;
  if (snap.version !== 1 || !Array.isArray(snap.trending)) return null;
  return snap;
}

async function writeKvSnapshot(snap: HomeSnapshot) {
  const env = await getCloudflareEnv();
  if (!env?.AURA_CACHE) return;
  await env.AURA_CACHE.put(HOME_CACHE_KEY, JSON.stringify(snap), {
    expirationTtl: Math.max(ttlSec() * 6, 600),
  });
}

function isFresh(snap: HomeSnapshot) {
  return Date.now() - snap.builtAt < ttlSec() * 1000;
}

/**
 * Fast homepage payload: memory → KV → live build.
 * Serves stale KV immediately and refreshes in the background (SWR).
 */
export async function getHomeSnapshot(): Promise<HomeSnapshot> {
  if (memorySnap && memorySnap.expires > Date.now()) {
    return memorySnap.value;
  }

  const cached = await readKvSnapshot();
  if (cached && isFresh(cached)) {
    memorySnap = { value: cached, expires: Date.now() + MEMORY_TTL_MS };
    return cached;
  }

  if (cached) {
    memorySnap = { value: cached, expires: Date.now() + MEMORY_TTL_MS };
    void runInBackground(async () => {
      const fresh = await buildHomeSnapshot();
      memorySnap = { value: fresh, expires: Date.now() + MEMORY_TTL_MS };
      await writeKvSnapshot(fresh);
    });
    return cached;
  }

  const fresh = await buildHomeSnapshot();
  memorySnap = { value: fresh, expires: Date.now() + MEMORY_TTL_MS };
  await writeKvSnapshot(fresh);
  return fresh;
}

export async function warmHomeSnapshot(): Promise<HomeSnapshot> {
  // Drop English-identity cache rows so warm can refill Bahasa titles.
  await purgeIdentityTranslations().catch(() => 0);
  const fresh = await buildHomeSnapshot();
  memorySnap = { value: fresh, expires: Date.now() + MEMORY_TTL_MS };
  await writeKvSnapshot(fresh);
  return fresh;
}
