"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { CITY_OPTIONS } from "@/lib/constants";

export default function ProfilPage() {
  const { data, update } = useSession();
  const user = data?.user;
  const [city, setCity] = useState(user?.city || "Jakarta");
  const [saved, setSaved] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-3.5 px-5 py-[60px] text-center">
        <p className="max-w-[30ch] text-[15px]">Masuk dulu buat lihat profil kamu.</p>
        <Link href="/masuk" className="btn btn-primary">
          <i className="fa-solid fa-user-plus" />
          Masuk / Daftar
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 py-7">
      <div className="mb-6 flex flex-col items-center gap-2.5 border-b-2 border-[var(--color-divider)] pb-6">
        <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[var(--color-neutral-800)] text-[30px] font-extrabold text-[var(--color-bg)]">
          {(user.name || "U").slice(0, 1).toUpperCase()}
        </div>
        <div className="text-lg font-extrabold">{user.name}</div>
        <span className="tag tag-outline">{city}</span>
        {user.role === "admin" ? (
          <Link href="/admin" className="btn btn-secondary mt-2">
            <i className="fa-solid fa-gauge" />
            Panel Admin
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        <div className="field">
          <label>Nama tampilan</label>
          <input className="input" value={user.name || ""} readOnly />
        </div>
        <div className="field">
          <label>Kota</label>
          <select
            className="input"
            value={city}
            onChange={async (e) => {
              const next = e.target.value;
              setCity(next);
              await update({ city: next });
              setSaved(true);
              setTimeout(() => setSaved(false), 1500);
            }}
          >
            {CITY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Email</label>
          <input className="input" value={user.email || ""} readOnly />
        </div>
        {saved ? <p className="text-sm text-emerald-700">Kota tersimpan.</p> : null}
        <button
          type="button"
          className="btn btn-secondary btn-block mt-2"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <i className="fa-solid fa-arrow-right-from-bracket" />
          Keluar
        </button>
      </div>
    </div>
  );
}
