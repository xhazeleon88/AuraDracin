import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminVideosPage() {
  const session = await auth();
  if (!session?.user) redirect("/masuk");
  if (session.user.role !== "admin") redirect("/");

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, title, slug, category, like_count, view_count, published, created_at
       FROM videos WHERE deleted_at IS NULL ORDER BY created_at DESC`,
    )
    .all() as {
    id: string;
    title: string;
    slug: string;
    category: string;
    like_count: number;
    view_count: number;
    published: number;
    created_at: string;
  }[];

  return (
    <div className="px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/admin" className="icon-btn" aria-label="Kembali">
          <i className="fa-solid fa-chevron-left" />
        </Link>
        <h2 className="text-xl">Kelola video</h2>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.id} className="border border-[var(--color-divider)] p-3">
            <div className="font-semibold">{row.title}</div>
            <div className="text-muted text-xs">
              {row.category} · ❤ {row.like_count} · ▶ {row.view_count} ·{" "}
              {row.published ? "published" : "draft"}
            </div>
            <Link href={`/video/${row.slug}`} className="mt-2 inline-flex text-sm">
              Lihat <i className="fa-solid fa-arrow-right ml-1" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
