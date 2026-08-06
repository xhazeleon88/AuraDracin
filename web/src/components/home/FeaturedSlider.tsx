"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fmtNum } from "@/lib/constants";
import { providerDisplayName } from "@/lib/studios";
import type { DramaCard } from "@/lib/types";

export function FeaturedSlider({ items }: { items: DramaCard[] }) {
  const slides = items.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  if (!slides.length) return null;
  const current = slides[index] || slides[0];
  const href = `/drama/${current.provider}/${encodeURIComponent(current.id)}`;

  return (
    <section
      className="relative h-[380px] overflow-hidden border-b-2 border-[var(--color-divider)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {slides.map((slide, i) => (
        <div
          key={`${slide.provider}-${slide.id}`}
          className="absolute inset-0 transition-opacity duration-500"
          style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? "auto" : "none" }}
          aria-hidden={i !== index}
        >
          {slide.cover ? (
            <Image
              src={slide.cover}
              alt={slide.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority={i === 0}
              loading={i === 0 ? undefined : "lazy"}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-full w-full bg-[var(--color-neutral-900)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-neutral-900)] via-[var(--color-neutral-900)]/35 to-transparent" />
        </div>
      ))}

      <div className="absolute bottom-[18px] left-4 right-4 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="tag tag-accent w-fit">Unggulan</span>
          <span className="rounded bg-black/45 px-2 py-0.5 text-[11px] text-white/90">
            {providerDisplayName(current.provider)}
          </span>
        </div>
        <h2 className="line-clamp-2 text-2xl text-[var(--color-neutral-100)]">{current.title}</h2>
        <div className="flex items-center gap-3 text-[12px] text-white/85">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <i className="fa-solid fa-eye" />
            {fmtNum(current.views || 0)}
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <i className="fa-solid fa-heart text-[var(--color-accent)]" />
            {fmtNum(current.likes || 0)}
          </span>
        </div>
        <Link href={href} className="btn btn-primary w-fit">
          <i className="fa-solid fa-play" />
          Tonton sekarang
        </Link>

        <div className="mt-1 flex items-center gap-3">
          <button
            type="button"
            className="icon-btn !h-8 !w-8 !text-white"
            aria-label="Sebelumnya"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
          >
            <i className="fa-solid fa-chevron-left text-sm" />
          </button>
          <div className="flex flex-1 items-center justify-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={`dot-${slide.provider}-${slide.id}`}
                type="button"
                aria-label={`Slide ${i + 1}`}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === index ? 18 : 6,
                  background: i === index ? "var(--color-accent)" : "rgba(255,255,255,0.45)",
                }}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="icon-btn !h-8 !w-8 !text-white"
            aria-label="Berikutnya"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
          >
            <i className="fa-solid fa-chevron-right text-sm" />
          </button>
        </div>
      </div>
    </section>
  );
}
