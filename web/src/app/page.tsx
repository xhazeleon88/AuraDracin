import Link from "next/link";
import { Suspense } from "react";
import { HorizontalRail } from "@/components/home/HorizontalRail";
import { SearchBar } from "@/components/home/SearchBar";
import { VideoCard } from "@/components/video/VideoCard";
import { CATEGORIES } from "@/lib/constants";
import {
  CATALOG_PROVIDERS,
  getHomepageCatalog,
  getLatest,
  searchDramas,
} from "@/lib/dramabos";
import { auth } from "@/lib/auth";
import { listCityPopularDramaRefs } from "@/lib/videos";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await auth();
  const city = session?.user?.city || "Jakarta";

  const [catalog, ...latestBatches] = await Promise.all([
    q
      ? Promise.all(CATALOG_PROVIDERS.map((p) => searchDramas(q, p))).then((batches) =>
          batches.flat(),
        )
      : getHomepageCatalog(240),
    ...CATALOG_PROVIDERS.map((p) => getLatest(p).catch(() => [])),
  ]);

  const trending = catalog;
  const latest = latestBatches.flat().slice(0, 36);
  const byProvider = (provider: string) =>
    catalog.filter((c) => c.provider === provider).slice(0, 24);

  const featured = trending[0];
  const featuredHref = featured
    ? `/drama/${featured.provider}/${encodeURIComponent(featured.id)}`
    : "/";

  const cityRefs = listCityPopularDramaRefs(city, 12);
  const cityItems =
    cityRefs.length > 0
      ? cityRefs
          .map((ref) =>
            catalog.find((c) => c.provider === ref.provider && c.id === ref.id),
          )
          .filter(Boolean)
      : trending.slice(8, 20);

  const providerRails = CATALOG_PROVIDERS.map((provider) => ({
    provider,
    items: byProvider(provider),
  })).filter((rail) => rail.items.length > 0);

  return (
    <div className="pb-24">
      <Suspense fallback={null}>
        <SearchBar />
      </Suspense>

      {featured ? (
        <section className="relative h-[380px] overflow-hidden border-b-2 border-[var(--color-divider)]">
          <img
            src={featured.cover}
            alt={featured.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-neutral-900)] via-[var(--color-neutral-900)]/30 to-transparent" />
          <div className="absolute bottom-[18px] left-4 right-4 flex flex-col gap-2">
            <span className="tag tag-accent w-fit">Unggulan</span>
            <h2 className="text-2xl text-[var(--color-neutral-100)]">{featured.title}</h2>
            <Link href={featuredHref} className="btn btn-primary w-fit">
              <i className="fa-solid fa-play" />
              Tonton sekarang
            </Link>
          </div>
        </section>
      ) : null}

      <HorizontalRail
        title="🔥 Lagi Populer"
        subtitle={
          q
            ? `Hasil pencarian “${q}” dari semua sumber`
            : `${trending.length} judul dari banyak sumber DramaBuzz`
        }
        items={trending.slice(0, 60)}
      />

      {providerRails.map((rail) => (
        <HorizontalRail
          key={rail.provider}
          title={rail.provider}
          subtitle={`${rail.items.length} drama dari ${rail.provider}`}
          items={rail.items}
        />
      ))}

      <section className="border-t-2 border-[var(--color-divider)] py-5">
        <div className="px-4 pb-1">
          <h3 className="text-[19px]">🆕 Terbaru</h3>
          <p className="text-muted m-0 text-xs">Update terbaru dari API</p>
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
