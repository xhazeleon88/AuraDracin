import Link from "next/link";
import { Suspense } from "react";
import { FeaturedSlider } from "@/components/home/FeaturedSlider";
import { HorizontalRail } from "@/components/home/HorizontalRail";
import { SearchBar } from "@/components/home/SearchBar";
import { CityPopularRail } from "@/components/home/CityPopularRail";
import { VideoCard } from "@/components/video/VideoCard";
import { CATEGORIES } from "@/lib/constants";
import { getHomeSnapshot } from "@/lib/home-cache";
import { providerDisplayName, providerSubtitle } from "@/lib/studios";

/** ISR-friendly homepage — search lives on /cari so this route can be cached. */
export const revalidate = 120;

function RailSkeleton({ title }: { title: string }) {
  return (
    <section className="border-t-2 border-[var(--color-divider)] py-5">
      <div className="px-4 pb-3">
        <h3 className="text-[19px]">{title}</h3>
        <div className="text-muted mt-1 h-3 w-40 animate-pulse bg-[var(--color-divider)]" />
      </div>
      <div className="flex gap-3 overflow-hidden px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[220px] w-[150px] shrink-0 animate-pulse bg-[var(--color-divider)]"
          />
        ))}
      </div>
    </section>
  );
}

async function HomeCatalog() {
  const snap = await getHomeSnapshot();

  return (
    <>
      {snap.featuredSlides.length ? <FeaturedSlider items={snap.featuredSlides} /> : null}

      <HorizontalRail
        title="🔥 Lagi Populer"
        subtitle="Kumpulan Drama terpopuler di AuraDracin"
        items={snap.trending}
      />

      <section className="border-t-2 border-[var(--color-divider)] py-5">
        <div className="px-4 pb-1">
          <h3 className="m-0 text-[19px]">📂 Kategori Cerita</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto px-4 pt-3.5">
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

      {snap.providerRails.map((rail) => (
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
          {snap.latest.slice(0, 12).map((item) => (
            <VideoCard
              key={`grid-${item.source}-${item.provider}-${item.id}`}
              item={item}
              widthClass="w-full"
            />
          ))}
        </div>
      </section>
    </>
  );
}

export default function HomePage() {
  return (
    <div className="pb-24">
      <Suspense fallback={null}>
        <SearchBar />
      </Suspense>

      <Suspense fallback={<RailSkeleton title="Unggulan & Populer" />}>
        <HomeCatalog />
      </Suspense>

      <Suspense fallback={<RailSkeleton title="📍 Lagi Rame di kotamu" />}>
        <CityPopularRail />
      </Suspense>

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
