import Link from "next/link";
import { fmtNum } from "@/lib/constants";
import type { DramaCard } from "@/lib/types";

export function VideoCard({
  item,
  widthClass = "w-[150px]",
}: {
  item: DramaCard;
  widthClass?: string;
}) {
  const href =
    item.source === "local" && item.slug
      ? `/video/${item.slug}`
      : `/drama/${item.provider}/${encodeURIComponent(item.id)}`;

  return (
    <Link href={href} className={`${widthClass} flex shrink-0 flex-col gap-1.5 text-[var(--color-text)]`}>
      <div className="portrait-card">
        <img src={item.cover} alt={item.title} loading="lazy" />
        {item.isNew ? (
          <span className="tag tag-accent absolute left-1.5 top-1.5 !text-[10px]">Baru</span>
        ) : null}
        {item.source === "dramabos" ? (
          <span className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
            {item.provider}
          </span>
        ) : null}
      </div>
      <div className="line-clamp-2 text-[13px] font-semibold leading-snug">{item.title}</div>
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-neutral-500)]">
        <i className="fa-solid fa-heart text-[13px] text-[var(--color-accent)]" />
        <span>{fmtNum(item.likes || 0)}</span>
        {item.episodeCount ? <span>· {item.episodeCount} eps</span> : null}
      </div>
    </Link>
  );
}
