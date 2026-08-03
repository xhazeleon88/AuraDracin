"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");

  return (
    <form
      className="flex gap-2 px-4 py-3"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : "/");
      }}
    >
      <input
        className="input"
        placeholder="Cari Dracin... contoh: CEO, balas dendam"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button type="submit" className="btn btn-primary">
        <i className="fa-solid fa-magnifying-glass" />
        Cari
      </button>
    </form>
  );
}
