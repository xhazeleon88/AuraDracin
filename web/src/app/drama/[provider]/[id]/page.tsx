import Link from "next/link";
import { notFound } from "next/navigation";
import { EngagementRail } from "@/components/video/Engagement";
import { HlsPlayer } from "@/components/video/HlsPlayer";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getDramaDetail, getStream } from "@/lib/dramabos";
import { recordView } from "@/lib/videos";

export const dynamic = "force-dynamic";

export default async function DramaWatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ provider: string; id: string }>;
  searchParams: Promise<{ ep?: string }>;
}) {
  const { provider, id } = await params;
  const { ep } = await searchParams;
  const episode = Math.max(1, Number(ep || 1) || 1);
  const session = await auth();

  const detail = await getDramaDetail(provider, decodeURIComponent(id));
  if (!detail) notFound();

  const stream = await getStream(provider, detail.id, episode);
  recordView("dramabos", `${provider}:${detail.id}`, session?.user?.id, session?.user?.city);

  const db = getDb();
  const targetId = `${provider}:${detail.id}`;
  const liked = session?.user
    ? Boolean(
        db
          .prepare(
            `SELECT 1 FROM likes WHERE user_id = ? AND target_type = 'dramabos' AND target_id = ?`,
          )
          .get(session.user.id, targetId),
      )
    : false;
  const likeCount = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM likes WHERE target_type = 'dramabos' AND target_id = ?`,
      )
      .get(targetId) as { c: number }
  ).c;
  const commentCount = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM comments WHERE target_type = 'dramabos' AND target_id = ? AND deleted_at IS NULL`,
      )
      .get(targetId) as { c: number }
  ).c;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-neutral-900)] text-[var(--color-neutral-100)]">
      <Link
        href="/"
        className="icon-btn absolute left-1.5 top-1.5 z-20 text-white"
        aria-label="Kembali"
      >
        <i className="fa-solid fa-chevron-left text-xl" />
      </Link>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="relative h-full max-w-full aspect-[9/16] bg-[var(--color-neutral-800)]">
          {stream?.url ? (
            <HlsPlayer
              src={stream.url}
              poster={detail.cover}
              type={stream.type || "hls"}
            />
          ) : (
            <div className="relative flex h-full w-full items-center justify-center bg-black">
              <img
                src={detail.cover}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-40"
              />
              <p className="relative z-10 px-4 text-center text-sm text-white">
                Stream belum tersedia untuk episode ini.
              </p>
            </div>
          )}
          <EngagementRail
            targetType="dramabos"
            targetId={targetId}
            initialLikes={likeCount || detail.likes || 0}
            initialComments={commentCount}
            liked={liked}
          />
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-[var(--color-neutral-800)] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-extrabold">@{detail.provider}</span>
          <span className="tag bg-[#fff2ef] text-[10px] text-[#7c1405]">
            {detail.category}
          </span>
          <span className="tag border border-[var(--color-neutral-700)] text-[10px] text-[var(--color-neutral-300)]">
            Ep {episode}
          </span>
        </div>
        <div className="text-[15px] font-semibold">{detail.title}</div>
        <p className="m-0 line-clamp-3 text-[13px] text-[var(--color-neutral-400)]">
          {detail.synopsis}
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {(detail.hashtags || []).map((h) => (
            <span
              key={h}
              className="tag border border-[var(--color-neutral-700)] text-[var(--color-neutral-300)]"
            >
              #{h}
            </span>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pt-2">
          {detail.episodes.slice(0, 24).map((item) => (
            <Link
              key={item.id}
              href={`/drama/${provider}/${encodeURIComponent(detail.id)}?ep=${item.number}`}
              className={`shrink-0 border px-3 py-1.5 text-xs ${
                item.number === episode
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                  : "border-[var(--color-neutral-700)] text-[var(--color-neutral-300)]"
              }`}
            >
              Ep {item.number}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
