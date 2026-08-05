/**
 * Quick verification: for each PLAYABLE provider, list/search one id,
 * then call getDramaDetail + getStream(ep=1).
 *
 * Usage: npx tsx --env-file=.env scripts/verify-playable-providers.mts
 */
import {
  PLAYABLE_PROVIDERS,
  getDramaDetail,
  getStream,
  getTrending,
  searchDramas,
} from "../src/lib/dramabos";

async function pickId(provider: string): Promise<string | null> {
  const trend = await getTrending(provider, 1).catch(() => []);
  if (trend[0]?.id) return trend[0].id;
  const search = await searchDramas("love story", provider).catch(() => []);
  if (search[0]?.id) return search[0].id;
  const fallback = await searchDramas("love", provider).catch(() => []);
  return fallback[0]?.id || null;
}

async function check(provider: string) {
  const id = await pickId(provider);
  if (!id) {
    return { provider, id: null, detail: false, stream: false, error: "no list/search id" };
  }
  const detail = await getDramaDetail(provider, id).catch((e) => {
    console.error(provider, "detail err", e);
    return null;
  });
  const stream = await getStream(provider, id, 1).catch((e) => {
    console.error(provider, "stream err", e);
    return null;
  });
  return {
    provider,
    id,
    title: detail?.title?.slice(0, 40),
    episodes: detail?.episodes?.length || 0,
    detail: Boolean(detail?.title),
    stream: Boolean(stream?.url),
    type: stream?.type,
    quality: stream?.quality,
    urlHint: stream?.url ? stream.url.slice(0, 72) : undefined,
  };
}

async function main() {
  const results = [];
  for (const provider of PLAYABLE_PROVIDERS) {
    process.stdout.write(`checking ${provider}...\n`);
    results.push(await check(provider));
  }
  console.log("\n=== RESULTS ===");
  for (const r of results) {
    const status =
      r.detail && r.stream ? "OK" : r.detail ? "DETAIL_ONLY" : r.error || "FAIL";
    console.log(
      `${status.padEnd(12)} ${r.provider.padEnd(12)} id=${r.id || "-"} eps=${r.episodes || 0} ${r.title || ""} ${r.type || ""} ${r.urlHint || r.error || ""}`,
    );
  }
  const ok = results.filter((r) => r.detail && r.stream).map((r) => r.provider);
  const fail = results.filter((r) => !(r.detail && r.stream)).map((r) => r.provider);
  console.log(`\nOK (${ok.length}): ${ok.join(", ")}`);
  console.log(`FAIL (${fail.length}): ${fail.join(", ") || "none"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
