"use client";

import Link from "next/link";
import { CoverImage } from "@/components/video/CoverImage";
import { fmtNum } from "@/lib/constants";
import { providerDisplayName } from "@/lib/studios";
import type { DramaCard } from "@/lib/types";

export function VideoCard({
  item,
  widthClass = "w-[150px]",
  priority = false,
}: {
  item: DramaCard;
  widthClass?: string;
  priority?: boolean;
}) {
  const href =
    item.source === "local" && item.slug
      ? `/video/${item.slug}`
      : `/drama/${item.provider}/${encodeURIComponent(item.id)}`;

  return (
    <Link href={href} className={`${widthClass} flex shrink-0 flex-col gap-1.5 text-[var(--color-text)]`}>
      <div className="portrait-card relative overflow-hidden">
        <CoverImage src={item.cover} alt={item.title} priority={priority} />
        {item.isNew ? (
          <span className="tag tag-accent absolute left-1.5 top-1.5 z-[1] !text-[10px]">Baru</span>
        ) : null}
        {item.source === "dramabos" ? (
          <span className="absolute bottom-1.5 left-1.5 z-[1] bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
            {providerDisplayName(item.provider)}
          </span>
        ) : null}
      </div>
      <div className="line-clamp-2 text-[13px] font-semibold leading-snug">{item.title}</div>
      <div className="flex flex-col gap-0.5 text-[11px] text-[var(--color-neutral-500)]">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
            <i className="fa-solid fa-eye text-[11px]" />
            {fmtNum(item.views || 0)}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
            <i className="fa-solid fa-heart text-[11px] text-[var(--color-accent)]" />
            {fmtNum(item.likes || 0)}
          </span>
        </div>
        {item.episodeCount ? (
          <span className="whitespace-nowrap">{item.episodeCount} eps</span>
        ) : null}
      </div>
    </Link>
  );
}
