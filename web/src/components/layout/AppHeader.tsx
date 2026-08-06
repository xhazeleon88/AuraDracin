"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export function AppHeader() {
  const { data } = useSession();
  const user = data?.user;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b-2 border-[var(--color-divider)] bg-[var(--color-bg)] px-4 py-3.5">
      <Link href="/" className="flex items-center gap-2 text-[var(--color-text)]">
        <img
          src="/assets/aura-dracin-mark.jpg"
          alt="Aura Dracin"
          className="h-10 w-10 object-cover"
        />
        <span className="font-[family-name:var(--font-heading)] text-xl font-extrabold text-[var(--color-neutral-600)]">
          Aura
        </span>
        <span className="font-[family-name:var(--font-heading)] text-xl font-extrabold text-[var(--color-accent)]">
          Dracin
        </span>
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <Link href="/cari" className="icon-btn" aria-label="Cari">
          <i className="fa-solid fa-magnifying-glass text-[17px]" />
        </Link>
        {user ? (
          <Link
            href="/profil"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-neutral-800)] text-xs font-extrabold text-[var(--color-bg)]"
          >
            {(user.name || "U").slice(0, 1).toUpperCase()}
          </Link>
        ) : (
          <Link href="/masuk" className="btn btn-primary !px-3.5 !py-1.5">
            <i className="fa-solid fa-right-to-bracket" />
            Masuk
          </Link>
        )}
      </div>
    </header>
  );
}
