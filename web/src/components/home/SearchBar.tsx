"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [pending, startTransition] = useTransition();

  function submit(next: string) {
    const value = next.trim();
    startTransition(() => {
      router.push(value ? `/?q=${encodeURIComponent(value)}` : "/");
    });
  }

  return (
    <form
      className="flex gap-2 px-4 py-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit(q);
      }}
    >
      <div className="relative min-w-0 flex-1">
        <input
          className="input w-full pr-9"
          placeholder="Cari Dracin... contoh: CEO, balas dendam"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
        />
        {q ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-neutral-500)]"
            aria-label="Hapus"
            onClick={() => {
              setQ("");
              submit("");
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        ) : null}
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        <i className={`fa-solid ${pending ? "fa-spinner fa-spin" : "fa-magnifying-glass"}`} />
        Cari
      </button>
    </form>
  );
}
