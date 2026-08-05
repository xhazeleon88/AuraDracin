import Link from "next/link";
import { Suspense } from "react";
import { FeaturedSlider } from "@/components/home/FeaturedSlider";
import { HorizontalRail } from "@/components/home/HorizontalRail";
import { SearchBar } from "@/components/home/SearchBar";
import { VideoCard } from "@/components/video/VideoCard";
import { CATEGORIES } from "@/lib/constants";
import {
  FEATURED_STUDIO_PROVIDERS,
  PLAYABLE_PROVIDERS,
  buildFeaturedSlides,
  getHomepageCatalog,
  getProviderRail,
  searchCatalog,
} from "@/lib/dramabos";
import { auth } from "@/lib/auth";
import { providerDisplayName, providerSubtitle } from "@/lib/studios";
import { listCityPopularDramaRefs, mergeLocalLikes } from "@/lib/videos";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await auth();
  const city = session?.user?.city || "Jakarta";
  const query = q?.trim() || "";

  // Search mode: skip homepage rails / multi-provider catalog work.
  if (query) {
    const started = Date.now();
    const results = mergeLocalLikes(await searchCatalog(query, 72));
    const ms = Date.now() - started;

    return (
      <div className="pb-24">
        <Suspense fallback={null}>
          <SearchBar />
        </Suspense>

        <section className="border-b-2 border-[var(--color-divider)] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="m-0 text-[19px]">Hasil untuk “{query}”</h2>
              <p className="text-muted m-0 mt-1 text-xs">
                {results.length
                  ? `${results.length} drama cocok · ${Math.max(1, Math.round(ms / 100) / 10)} dtk`
                  : "Tidak ada hasil. Coba kata lain seperti CEO, balas dendam, atau fantasi."}
              </p>
            </div>
            <Link href="/" className="btn shrink-0 text-[13px]">
              Reset
            </Link>
          </div>
        </section>

        {results.length ? (
          <div className="grid grid-cols-2 gap-3 px-4 py-4">
            {results.map((item) => (
              <VideoCard
                key={`search-${item.source}-${item.provider}-${item.id}`}
                item={item}
                widthClass="w-full"
              />
            ))}
          </div>
        ) : (
          <div className="px-4 py-8">
            <p className="text-muted m-0 text-sm">Saran pencarian cepat:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["CEO", "balas dendam", "cinta", "fantasi", "kontrak nikah", "baby"].map((hint) => (
                <Link
                  key={hint}
                  href={`/?q=${encodeURIComponent(hint)}`}
                  className="border border-[var(--color-divider)] px-3 py-1.5 text-[13px] text-[var(--color-text)]"
                >
                  {hint}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Featured studios first; remaining playable providers fill extra rails.
  const [catalogRaw, ...providerBatches] = await Promise.all([
    getHomepageCatalog(240),
    ...PLAYABLE_PROVIDERS.map(async (provider) => {
      const items = await getProviderRail(provider, 25).catch(() => []);
      return { provider, items: mergeLocalLikes(items) };
    }),
  ]);

  const catalog = mergeLocalLikes(catalogRaw);
  const trending = catalog;
  const latest = mergeLocalLikes(
    providerBatches.flatMap((batch) => batch.items),
  ).slice(0, 36);

  // ReelShort / GoodShort first, then remaining live studio rails.
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
      items: batch.items.slice(0, 25),
    }))
    .filter((rail) => rail.items.length > 0);

  const featuredSlides = mergeLocalLikes(await buildFeaturedSlides(catalog, 5));

  const cityRefs = listCityPopularDramaRefs(city, 12);
  const cityItems =
    cityRefs.length > 0
      ? cityRefs
          .map((ref) =>
            catalog.find((c) => c.provider === ref.provider && c.id === ref.id),
          )
          .filter(Boolean)
      : trending.slice(8, 20);

  return (
    <div className="pb-24">
      <Suspense fallback={null}>
        <SearchBar />
      </Suspense>

      {featuredSlides.length ? <FeaturedSlider items={featuredSlides} /> : null}

      <HorizontalRail
        title="🔥 Lagi Populer"
        subtitle="Kumpulan Drama terpopuler di AuraDracin"
        items={trending.slice(0, 60)}
      />

      {providerRails.map((rail) => (
        <HorizontalRail
          key={rail.provider}
          title={providerDisplayName(rail.provider)}
          subtitle={providerSubtitle(rail.provider)}
          href={`/studio/${rail.provider}`}
          items={rail.items}
        />
      ))}

      <section className="border-t-2 border-[var(--color-divider)] py-5">
        <div className="px-4 pb-1">
          <h3 className="text-[19px]">🆕 Terbaru</h3>
          <p className="text-muted m-0 text-xs">Terbaru di AuraDracin</p>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pt-3.5">
          {latest.slice(0, 12).map((item) => (
            <VideoCard
              key={`grid-${item.source}-${item.provider}-${item.id}`}
              item={item}
              widthClass="w-full"
            />
          ))}
        </div>
      </section>

      <section className="border-t-2 border-[var(--color-divider)] py-5">
        <h3 className="mb-3 px-4 text-[19px]">📂 Kategori Cerita</h3>
        <div className="flex gap-2 overflow-x-auto px-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/kategori/${c.slug}`}
              className="shrink-0 border border-[var(--color-divider)] px-3.5 py-2 text-[13px] text-[var(--color-text)]"
            >
              <i className={`fa-solid ${c.icon} mr-1.5`} />
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      <HorizontalRail
        title={`📍 Lagi Rame di ${city}`}
        subtitle={`Yang lagi banyak ditonton di ${city}`}
        items={(cityItems as typeof trending).slice(0, 12)}
      />

      <footer className="flex flex-col gap-2.5 border-t-2 border-[var(--color-divider)] px-4 py-7 text-[13px]">
        <Link href="/tentang">Tentang Aura Dracin</Link>
        <Link href="/syarat">Syarat & Ketentuan</Link>
        <Link href="/privasi">Kebijakan Privasi</Link>
        <p className="text-muted mt-2 text-[11px]">
          © 2026 Aura Dracin. Nonton Dracin, rasain auranya.
        </p>
      </footer>
    </div>
  );
}
