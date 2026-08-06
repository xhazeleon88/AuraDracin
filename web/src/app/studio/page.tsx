import Link from "next/link";
import { StudioLogo } from "@/components/studio/StudioLogo";
import { isPlayableProvider } from "@/lib/dramabos";
import { listStudioProfiles } from "@/lib/studios";

export const dynamic = "force-dynamic";

export default function StudioIndexPage() {
  // Full DramaBos catalog — playable studios first for easier discovery.
  const studios = [...listStudioProfiles()].sort((a, b) => {
    const ap = isPlayableProvider(a.id) ? 0 : 1;
    const bp = isPlayableProvider(b.id) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.name.localeCompare(b.name, "id");
  });

  return (
    <div className="pb-24">
      <div className="border-b-2 border-[var(--color-divider)] px-4 py-5">
        <h1 className="text-[22px]">Studio</h1>
        <p className="text-muted m-0 mt-1 text-sm">
          {studios.length} studio drama pendek dari DramaBos. Streaming eksklusif di AuraDracin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 px-4 py-4">
        {studios.map((studio) => (
          <Link
            key={studio.id}
            href={`/studio/${studio.id}`}
            className="relative overflow-hidden border-2 border-[var(--color-divider)] text-[var(--color-text)] no-underline"
          >
            <div
              className="relative flex h-[108px] items-center gap-3.5 px-4"
              style={{
                background: `linear-gradient(120deg, ${studio.accent} 0%, #1a1a1a 58%, #0d0d0d 100%)`,
              }}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-white/30 bg-white">
                <StudioLogo
                  src={studio.logo}
                  name={studio.name}
                  accent={studio.accent}
                  className="h-12 w-12 object-contain"
                />
              </div>
              <div className="min-w-0 text-white">
                <h2 className="m-0 text-[18px]">{studio.name}</h2>
                <p className="m-0 mt-0.5 line-clamp-2 text-[12px] text-white/80">
                  {studio.tagline}
                </p>
              </div>
              <i className="fa-solid fa-chevron-right ml-auto text-white/70" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
