import Link from "next/link";
import { VideoCard } from "@/components/video/VideoCard";
import { CATEGORIES, categoryLabel } from "@/lib/constants";
import { getByGenre, genreQueryForCategory } from "@/lib/dramabos";
import { listByCategory, toDramaCard } from "@/lib/videos";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [remote, local] = await Promise.all([
    getByGenre(genreQueryForCategory(slug)),
    listByCategory(slug),
  ]);

  const items = [...remote, ...local.map(toDramaCard)];

  return (
    <div className="pb-6">
      <div className="flex items-center gap-3 px-4 py-4">
        <Link href="/" className="icon-btn" aria-label="Kembali">
          <i className="fa-solid fa-chevron-left text-lg" />
        </Link>
        <h3 className="text-[19px]">{categoryLabel(slug)}</h3>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-3.5">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/kategori/${c.slug}`}
            className="shrink-0 border px-3.5 py-2 text-[13px]"
            style={{
              background: c.slug === slug ? "var(--color-accent)" : "transparent",
              color: c.slug === slug ? "var(--color-bg)" : "var(--color-text)",
              borderColor: c.slug === slug ? "var(--color-accent)" : "var(--color-divider)",
            }}
          >
            {c.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t-2 border-[var(--color-divider)] px-4 pt-4">
        {items.map((item) => (
          <VideoCard
            key={`${item.source}-${item.provider}-${item.id}`}
            item={item}
            widthClass="w-full"
          />
        ))}
      </div>
    </div>
  );
}
