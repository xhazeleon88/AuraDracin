"use client";

import { useEffect, useState } from "react";
import { HorizontalRail } from "@/components/home/HorizontalRail";
import type { DramaCard } from "@/lib/types";

/**
 * City rail loads after paint via API so homepage HTML stays cacheable
 * (no cookies()/auth on the critical path).
 */
export function CityPopularRail() {
  const [city, setCity] = useState("Jakarta");
  const [items, setItems] = useState<DramaCard[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/home/city", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { city?: string; items?: DramaCard[] };
        if (cancelled) return;
        if (data.city) setCity(data.city);
        if (Array.isArray(data.items)) setItems(data.items);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready && !items.length) {
    return (
      <section className="border-t-2 border-[var(--color-divider)] py-5">
        <div className="px-4 pb-3">
          <h3 className="text-[19px]">📍 Lagi Rame di kotamu</h3>
          <div className="text-muted mt-1 h-3 w-48 animate-pulse bg-[var(--color-divider)]" />
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <HorizontalRail
      title={`📍 Lagi Rame di ${city}`}
      subtitle={`Yang lagi banyak ditonton di ${city}`}
      items={items.slice(0, 12)}
    />
  );
}
