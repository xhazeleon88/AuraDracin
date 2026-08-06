"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoverImage } from "@/components/video/CoverImage";
import type { DramaCard } from "@/lib/types";

export function RelatedDramas({
  provider,
  id,
  category,
}: {
  provider: string;
  id: string;
  category?: string;
}) {
  const [items, setItems] = useState<DramaCard[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const qs = new URLSearchParams({
      provider,
      id,
      category: category || "romance",
      limit: "5",
    });
    fetch(`/api/dramabos/related?${qs}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { items?: DramaCard[] };
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [provider, id, category]);

  if (!items.length) return null;

  return (
    <div className="space-y-2 border-t border-[var(--color-neutral-800)] pt-3">
      <h3 className="m-0 text-[14px] font-extrabold text-[var(--color-neutral-100)]">
        Drama terkait
      </h3>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {items.map((item) => (
          <Link
            key={`${item.provider}-${item.id}`}
            href={`/drama/${item.provider}/${encodeURIComponent(item.id)}`}
            className="w-[108px] shrink-0 text-[var(--color-neutral-100)] no-underline"
          >
            <div className="portrait-card relative overflow-hidden rounded-sm">
              <CoverImage src={item.cover} alt={item.title} />
            </div>
            <div className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-snug text-white/90">
              {item.title}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
