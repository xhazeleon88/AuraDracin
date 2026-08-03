import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/masuk");
  if (session.user.role !== "admin") redirect("/");

  const db = getDb();
  const videos = (db.prepare(`SELECT COUNT(*) as c FROM videos WHERE deleted_at IS NULL`).get() as { c: number }).c;
  const users = (db.prepare(`SELECT COUNT(*) as c FROM users`).get() as { c: number }).c;
  const likes = (db.prepare(`SELECT COUNT(*) as c FROM likes`).get() as { c: number }).c;

  return (
    <div className="px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/" className="icon-btn" aria-label="Home">
          <i className="fa-solid fa-chevron-left" />
        </Link>
        <h2 className="text-xl">Admin Aura Dracin</h2>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2">
        {[
          ["Video", videos],
          ["User", users],
          ["Likes", likes],
        ].map(([label, value]) => (
          <div key={String(label)} className="border border-[var(--color-divider)] bg-[var(--color-surface)] p-3">
            <div className="text-xs text-muted">{label}</div>
            <div className="text-2xl font-extrabold">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Link href="/admin/upload" className="btn btn-primary btn-block justify-start">
          <i className="fa-solid fa-cloud-arrow-up" />
          Upload video baru
        </Link>
        <Link href="/admin/videos" className="btn btn-secondary btn-block justify-start">
          <i className="fa-solid fa-clapperboard" />
          Kelola video
        </Link>
      </div>
    </div>
  );
}
