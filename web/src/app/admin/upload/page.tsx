"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "@/lib/constants";

export default function AdminUploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("romance");
  const [hashtags, setHashtags] = useState("dracin,romance");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Pilih file video/gambar dulu");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const body = new FormData();
      body.set("title", title);
      body.set("description", description);
      body.set("category", category);
      body.set("hashtags", hashtags);
      body.set("file", file);
      const res = await fetch("/api/admin/videos", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload gagal");
      router.push(`/video/${json.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/admin" className="icon-btn" aria-label="Kembali">
          <i className="fa-solid fa-chevron-left" />
        </Link>
        <h2 className="text-xl">Upload video</h2>
      </div>

      <form className="flex flex-col gap-3.5" onSubmit={onSubmit}>
        <div className="field">
          <label>Judul</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        </div>
        <div className="field">
          <label>Caption / deskripsi</label>
          <textarea
            className="input min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={2000}
          />
        </div>
        <div className="field">
          <label>Kategori</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Hashtags (pisah koma)</label>
          <input className="input" value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
        </div>
        <div className="field">
          <label>File portrait (mp4 / webm / jpg)</label>
          <input
            className="input"
            type="file"
            accept="video/mp4,video/webm,image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </div>
        {error ? <p className="text-sm text-[var(--color-accent)]">{error}</p> : null}
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          <i className="fa-solid fa-cloud-arrow-up" />
          {loading ? "Uploading..." : "Publish"}
        </button>
      </form>
    </div>
  );
}
