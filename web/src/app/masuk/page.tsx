"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function MasukForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<"masuk" | "daftar">(
    params.get("tab") === "daftar" ? "daftar" : "masuk",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("Jakarta");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (tab === "daftar") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, city }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal daftar");
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) throw new Error("Email atau password salah");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-8">
      <img
        src="/assets/aura-dracin-logo.jpg"
        alt="Aura Dracin"
        className="mx-auto mb-5 h-[150px] w-[150px] object-cover"
      />
      <h2 className="mb-1 text-[26px]">Aura Dracin</h2>
      <p className="text-muted mb-6 text-[13px]">Belum punya akun? Daftar dulu, gratis kok.</p>

      <div className="seg mb-6">
        <button type="button" className={tab === "masuk" ? "active" : ""} onClick={() => setTab("masuk")}>
          Masuk
        </button>
        <button type="button" className={tab === "daftar" ? "active" : ""} onClick={() => setTab("daftar")}>
          Daftar
        </button>
      </div>

      <form className="flex flex-col gap-3.5" onSubmit={onSubmit}>
        {tab === "daftar" ? (
          <div className="field">
            <label>Nama tampilan</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        ) : null}
        <div className="field">
          <label>Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            className="input"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {tab === "daftar" ? (
          <div className="field">
            <label>Kota</label>
            <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
              {[
                "Jakarta",
                "Surabaya",
                "Bandung",
                "Medan",
                "Semarang",
                "Makassar",
                "Yogyakarta",
                "Denpasar",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {error ? <p className="text-sm text-[var(--color-accent)]">{error}</p> : null}

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          <i className="fa-solid fa-right-to-bracket" />
          {loading ? "Sebentar..." : tab === "masuk" ? "Masuk" : "Daftar sekarang"}
        </button>

        {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "1" ? (
          <>
            <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-neutral-500)]">
              <div className="h-px flex-1 bg-[var(--color-divider)]" />
              atau
              <div className="h-px flex-1 bg-[var(--color-divider)]" />
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => signIn("google", { callbackUrl: "/" })}
            >
              <i className="fa-brands fa-google" />
              Lanjut dengan Google
            </button>
          </>
        ) : null}
      </form>

      <p className="text-muted mt-6 text-center text-xs">
        Admin demo: admin@auradracin.com / admin123456 ·{" "}
        <Link href="/admin">Panel admin</Link>
      </p>
    </div>
  );
}

export default function MasukPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <MasukForm />
    </Suspense>
  );
}
