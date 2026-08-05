import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { dbFirst } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/masuk");
  if (session.user.role !== "admin") redirect("/");

  const videos = (await dbFirst<{ c: number }>(`SELECT COUNT(*) as c FROM videos WHERE deleted_at IS NULL`))?.c ?? 0;
  const users = (await dbFirst<{ c: number }>(`SELECT COUNT(*) as c FROM users`))?.c ?? 0;
  const likes = (await dbFirst<{ c: number }>(`SELECT COUNT(*) as c FROM likes`))?.c ?? 0;

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
