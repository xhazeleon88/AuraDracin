import Link from "next/link";
import { Suspense } from "react";
import { HorizontalRail } from "@/components/home/HorizontalRail";
import { SearchBar } from "@/components/home/SearchBar";
import { VideoCard } from "@/components/video/VideoCard";
import { CATEGORIES } from "@/lib/constants";
import {
  getLatest,
  getStatus,
  getTrending,
  searchDramas,
} from "@/lib/dramabos";
import { auth } from "@/lib/auth";
import {
  listCityPopular,
  listLocalVideos,
  listPopularLocal,
  toDramaCard,
} from "@/lib/videos";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await auth();
  const city = session?.user?.city || "Jakarta";
  const status = await getStatus();

  const [trending, latest, localPopular, localLatest, cityVideos] = await Promise.all([
    q ? searchDramas(q) : getTrending(),
    getLatest(),
    listPopularLocal(12),
    listLocalVideos(12),
    listCityPopular(city, 10),
  ]);

  const featured =
    trending[0] || (localPopular[0] ? toDramaCard(localPopular[0]) : undefined);
  const featuredHref = featured
    ? featured.source === "local" && featured.slug
      ? `/video/${featured.slug}`
      : `/drama/${featured.provider}/${encodeURIComponent(featured.id)}`
    : "/";

  return (
    <div className="pb-4">
      {status.mode === "demo" ? (
        <div className="border-b-2 border-[var(--color-divider)] bg-[#fff2ef] px-4 py-2.5 text-[12px] text-[#7c1405]">
          <strong>Mode demo DramaBos.</strong> {status.reason}{" "}
          <a href="https://dramabos.live" target="_blank" rel="noreferrer">
            Ambil API key →
          </a>
        </div>
      ) : (
        <div className="border-b-2 border-[var(--color-divider)] bg-emerald-50 px-4 py-2.5 text-[12px] text-emerald-800">
          Live feed DramaBos · provider <strong>{status.provider}</strong>
        </div>
      )}

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
            ? `Hasil pencarian “${q}” dari DramaBos`
            : "Yang paling hits dari DramaBos minggu ini"
        }
        items={trending.slice(0, 16)}
      />

      <section className="border-t-2 border-[var(--color-divider)] py-5">
        <div className="px-4 pb-1">
          <h3 className="text-[19px]">🆕 Terbaru</h3>
          <p className="text-muted m-0 text-xs">Upload lokal + update DramaBos</p>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pt-3.5">
          {[...latest.slice(0, 4).map((d) => ({ ...d })), ...localLatest.map(toDramaCard)]
            .slice(0, 8)
            .map((item) => (
              <VideoCard
                key={`grid-${item.source}-${item.id}`}
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
        subtitle={`Video paling hits dari sesama warga ${city}`}
        items={cityVideos.map(toDramaCard)}
      />

      <HorizontalRail
        title="Upload Aura Dracin"
        subtitle="Konten admin lokal"
        items={localPopular.map(toDramaCard)}
      />

      <footer className="flex flex-col gap-2.5 border-t-2 border-[var(--color-divider)] px-4 py-7 text-[13px]">
        <a href="#">Tentang Aura Dracin</a>
        <a href="#">Syarat & Ketentuan</a>
        <a href="#">Kebijakan Privasi</a>
        <a href="https://dramabos.live" target="_blank" rel="noreferrer">
          Powered by DramaBos API
        </a>
        <p className="text-muted mt-2 text-[11px]">
          © 2026 Aura Dracin. Nonton Dracin, rasain auranya.
        </p>
      </footer>
    </div>
  );
}
