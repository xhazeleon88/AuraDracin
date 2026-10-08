"use client";

import Link from "next/link";
import { useState } from "react";
import { RelatedDramas } from "@/components/video/RelatedDramas";
import { fmtNum } from "@/lib/constants";
import { providerDisplayName } from "@/lib/studios";

type Episode = { id: string; number: number };

export function WatchInfoSheet({
  provider,
  dramaId,
  title,
  category,
  synopsis,
  hashtags,
  views,
  likes,
  episode,
  episodeCount,
  episodes,
}: {
  provider: string;
  dramaId: string;
  title: string;
  category: string;
  synopsis: string;
  hashtags: string[];
  views: number;
  likes: number;
  episode: number;
  episodeCount?: number;
  episodes: Episode[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* TikTok-style caption — left bottom, clear of scrubber + rail */}
      <button
        type="button"
        className="absolute bottom-[52px] left-3 right-[72px] z-[35] max-w-[78%] text-left sm:bottom-[56px]"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="Buka detail drama"
      >
        <div className="text-[13px] font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          @{providerDisplayName(provider)}
        </div>
        <div className="mt-0.5 line-clamp-2 text-[12px] font-semibold leading-snug text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          {title}
          <span className="font-medium text-white/70">
            {" "}
            · Ep {episode}
            {episodeCount ? `/${episodeCount}` : ""}
          </span>
        </div>
        <div className="mt-1 text-[11px] font-semibold text-white/70">
          Selengkapnya
        </div>
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/55"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="fixed bottom-0 left-1/2 z-50 flex max-h-[72vh] w-full max-w-[480px] -translate-x-1/2 flex-col overflow-hidden rounded-t-2xl border-t border-white/10 bg-[var(--color-neutral-900)] text-[var(--color-neutral-100)] shadow-2xl animate-[sheetUp_0.22s_ease-out]">
            <div className="flex shrink-0 justify-center px-4 pb-1 pt-3">
              <div className="h-1 w-10 rounded-full bg-white/25" />
            </div>
            <div className="flex items-start gap-3 border-b border-white/10 px-4 pb-3">
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold leading-snug">{title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[var(--color-neutral-400)]">
                  <span className="font-extrabold text-[var(--color-neutral-100)]">
                    @{providerDisplayName(provider)}
                  </span>
                  <span className="tag bg-[#fff2ef] text-[10px] text-[#7c1405]">{category}</span>
                  <span>
                    Ep {episode}
                    {episodeCount ? ` / ${episodeCount}` : ""}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="icon-btn shrink-0 text-white"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto px-4 py-3.5">
              <div className="flex items-center gap-3 text-[12px] text-[var(--color-neutral-400)]">
                <span className="inline-flex items-center gap-1.5">
                  <i className="fa-solid fa-eye" />
                  {fmtNum(views)} views
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="fa-solid fa-heart text-[var(--color-accent)]" />
                  {fmtNum(likes)} likes
                </span>
              </div>
              <p className="m-0 whitespace-pre-line text-[13px] leading-relaxed text-[var(--color-neutral-400)]">
                {synopsis}
              </p>
              {hashtags.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {hashtags.map((h) => (
                    <span
                      key={h}
                      className="tag border border-[var(--color-neutral-700)] text-[var(--color-neutral-300)]"
                    >
                      #{h}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex gap-2 overflow-x-auto pt-1">
                {episodes.slice(0, 40).map((item) => {
                  const active = item.number === episode;
                  return (
                    <Link
                      key={item.id}
                      href={`/drama/${provider}/${encodeURIComponent(dramaId)}?ep=${item.number}`}
                      className={`ep-chip shrink-0 border px-3 py-1.5 text-xs ${
                        active ? "ep-chip-active" : "ep-chip-idle"
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      Ep {item.number}
                    </Link>
                  );
                })}
              </div>

              <RelatedDramas provider={provider} id={dramaId} category={category} />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
