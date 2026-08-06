import Link from "next/link";
import { Suspense } from "react";
import { SearchBar } from "@/components/home/SearchBar";
import { VideoCard } from "@/components/video/VideoCard";
import { searchCatalog } from "@/lib/dramabos";
import { mergeLocalLikes } from "@/lib/videos";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() || "";
  const started = Date.now();
  const results = query ? await mergeLocalLikes(await searchCatalog(query, 72)) : [];
  const ms = Date.now() - started;

  return (
    <div className="pb-24">
      <Suspense fallback={null}>
        <SearchBar />
      </Suspense>

      <section className="border-b-2 border-[var(--color-divider)] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-[19px]">
              {query ? `Hasil untuk “${query}”` : "Cari Dracin"}
            </h2>
            <p className="text-muted m-0 mt-1 text-xs">
              {query
                ? results.length
                  ? `${results.length} drama cocok · ${Math.max(1, Math.round(ms / 100) / 10)} dtk`
                  : "Tidak ada hasil. Coba kata lain seperti CEO, balas dendam, atau fantasi."
                : "Ketik judul, genre, atau kata kunci di atas."}
            </p>
          </div>
          <Link href="/" className="btn shrink-0 text-[13px]">
            Home
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
                href={`/cari?q=${encodeURIComponent(hint)}`}
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
