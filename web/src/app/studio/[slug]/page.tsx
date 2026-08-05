import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoCard } from "@/components/video/VideoCard";
import { getProviderRail, isPlayableProvider } from "@/lib/dramabos";
import { getStudioProfile, isKnownStudio, listStudioProfiles } from "@/lib/studios";
import { mergeLocalLikes } from "@/lib/videos";

export const dynamic = "force-dynamic";

export default async function StudioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const id = slug.toLowerCase();
  if (!isKnownStudio(id)) notFound();

  const studio = getStudioProfile(id);
  const playable = isPlayableProvider(id);
  const catalog = playable
    ? await mergeLocalLikes(await getProviderRail(id, 48).catch(() => []))
    : [];

  const hero = catalog[0]?.cover || "";
  const others = listStudioProfiles()
    .filter((s) => s.id !== id && isPlayableProvider(s.id))
    .slice(0, 8);

  return (
    <div className="pb-24">
      <section className="relative overflow-hidden border-b-2 border-[var(--color-divider)]">
        <div className="relative h-[220px] bg-[var(--color-neutral-900)]">
          {hero ? (
            <img
              src={hero}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: `linear-gradient(160deg, ${studio.accent}, #111)` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-neutral-900)] via-black/50 to-black/20" />
        </div>

        <div className="relative -mt-16 px-4 pb-5">
          <Link href="/studio" className="icon-btn mb-3 !bg-black/40 !text-white" aria-label="Kembali">
            <i className="fa-solid fa-chevron-left text-lg" />
          </Link>

          <div className="flex items-end gap-3.5">
            <div
              className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden border-2 bg-[var(--color-bg)]"
              style={{ borderColor: studio.accent }}
            >
              <img
                src={studio.logo}
                alt={studio.name}
                className="h-12 w-12 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="m-0 text-[24px] text-[var(--color-neutral-100)]">{studio.name}</h1>
              <p className="m-0 mt-1 text-[13px] text-white/80">{studio.tagline}</p>
            </div>
          </div>

          <p className="text-muted mt-4 mb-0 text-sm leading-relaxed text-[var(--color-neutral-100)]/85">
            {studio.about}
          </p>
          <p className="mt-2 mb-0 text-[12px] font-semibold" style={{ color: studio.accent }}>
            Produksi {studio.name} · streaming eksklusif di AuraDracin
          </p>
        </div>
      </section>

      <section className="border-b-2 border-[var(--color-divider)] py-5">
        <div className="px-4 pb-1">
          <h3 className="text-[19px]">Katalog {studio.name}</h3>
          <p className="text-muted m-0 text-xs">Drama dari {studio.name} di AuraDracin</p>
        </div>
        {catalog.length ? (
          <div className="grid grid-cols-2 gap-3 px-4 pt-3.5">
            {catalog.map((item) => (
              <VideoCard
                key={`${item.source}-${item.provider}-${item.id}`}
                item={item}
                widthClass="w-full"
              />
            ))}
          </div>
        ) : (
          <p className="text-muted px-4 pt-3 text-sm">
            {playable
              ? `Katalog ${studio.name} sedang kosong. Coba studio lain dulu ya.`
              : `Streaming ${studio.name} belum tersedia di AuraDracin. Coba ReelShort atau GoodShort dulu ya.`}
          </p>
        )}
      </section>

      <section className="py-5">
        <h3 className="mb-3 px-4 text-[19px]">Studio lain</h3>
        <div className="flex gap-2 overflow-x-auto px-4">
          {others.map((s) => (
            <Link
              key={s.id}
              href={`/studio/${s.id}`}
              className="flex shrink-0 items-center gap-2 border border-[var(--color-divider)] px-3 py-2 text-[13px] text-[var(--color-text)] no-underline"
            >
              <img
                src={s.logo}
                alt=""
                className="h-5 w-5 object-contain"
                referrerPolicy="no-referrer"
              />
              {s.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
