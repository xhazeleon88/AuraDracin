"use client";

import Link from "next/link";
import { useState } from "react";
import { fmtNum } from "@/lib/constants";
import { providerDisplayName } from "@/lib/studios";
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
  const [coverFailed, setCoverFailed] = useState(false);
  const showCover = Boolean(item.cover) && !coverFailed;

  return (
    <Link href={href} className={`${widthClass} flex shrink-0 flex-col gap-1.5 text-[var(--color-text)]`}>
      <div className="portrait-card">
        {showCover ? (
          <img
            src={item.cover}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-end bg-[linear-gradient(160deg,#1a1a1a_0%,#3a1515_55%,#7a1f1f_100%)] p-2.5"
            aria-hidden
          >
            <span className="line-clamp-4 text-[12px] font-bold leading-snug text-white/90">
              {item.title}
            </span>
          </div>
        )}
        {item.isNew ? (
          <span className="tag tag-accent absolute left-1.5 top-1.5 !text-[10px]">Baru</span>
        ) : null}
        {item.source === "dramabos" ? (
          <span className="absolute bottom-1.5 left-1.5 bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
            {providerDisplayName(item.provider)}
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
