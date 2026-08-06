"use client";

import nextDynamic from "next/dynamic";

export const LazyHlsPlayer = nextDynamic(
  () => import("@/components/video/HlsPlayer").then((m) => m.HlsPlayer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[var(--color-neutral-800)] text-sm text-white/70">
        Memuat player…
      </div>
    ),
  },
);
