import Link from "next/link";
import { notFound } from "next/navigation";
import { EngagementRail } from "@/components/video/Engagement";
import { HlsPlayer } from "@/components/video/HlsPlayer";
import { auth } from "@/lib/auth";
import { fmtNum } from "@/lib/constants";
import { getDb } from "@/lib/db";
import { getDramaDetail, getStream } from "@/lib/dramabos";
import { enrichDramaEngagement } from "@/lib/engagement";
import { getBahasaSubtitles } from "@/lib/subtitles";
import { providerDisplayName } from "@/lib/studios";
import { countLocalLikes, recordView } from "@/lib/videos";

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

  const rawDetail = await getDramaDetail(provider, decodeURIComponent(id));
  if (!rawDetail) notFound();
  const detail = enrichDramaEngagement(rawDetail);

  const stream = await getStream(provider, detail.id, episode);
  const nextEpisode = detail.episodes.find((item) => item.number === episode + 1);
  const nextHref = nextEpisode
    ? `/drama/${provider}/${encodeURIComponent(detail.id)}?ep=${nextEpisode.number}`
    : undefined;
  const subtitleUrl = stream?.url
    ? `/api/subtitles?provider=${encodeURIComponent(provider)}&id=${encodeURIComponent(detail.id)}&ep=${episode}&v=3`
    : undefined;
  // Warm subtitle cache in the background so the player gets cues sooner.
  if (stream?.url) {
    void getBahasaSubtitles({
      provider,
      dramaId: detail.id,
      episode,
      streamUrl: stream.url,
    }).catch(() => undefined);
  }
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
  const localLikeCount = countLocalLikes("dramabos", targetId);
  const combinedLikes = (detail.likes || 0) + localLikeCount;
  const commentCount = (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM comments WHERE target_type = 'dramabos' AND target_id = ? AND deleted_at IS NULL`,
      )
      .get(targetId) as { c: number }
  ).c;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-neutral-900)] text-[var(--color-neutral-100)]">
      {/* Keep back control outside the video so it never fights native fullscreen/PiP chrome */}
      <div className="flex shrink-0 items-center gap-2 px-2 py-1.5">
        <Link
          href="/"
          className="icon-btn !text-white hover:!text-white"
          aria-label="Kembali"
        >
          <i className="fa-solid fa-chevron-left text-xl" />
        </Link>
        <span className="truncate text-[13px] font-semibold text-[var(--color-neutral-100)]">
          {detail.title}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="relative h-full max-w-full aspect-[9/16] bg-[var(--color-neutral-800)]">
          {stream?.url ? (
            <HlsPlayer
              src={stream.url}
              poster={detail.cover}
              type={stream.type || "hls"}
              nextHref={nextHref}
              subtitleUrl={subtitleUrl}
            />
          ) : (
            <div className="relative flex h-full w-full items-center justify-center bg-black">
              <img
                src={detail.cover}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-40"
                referrerPolicy="no-referrer"
              />
              <p className="relative z-10 px-4 text-center text-sm text-white">
                Stream belum tersedia untuk episode ini.
              </p>
            </div>
          )}
          <EngagementRail
            targetType="dramabos"
            targetId={targetId}
            initialLikes={combinedLikes}
            initialComments={commentCount}
            liked={liked}
          />
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-[var(--color-neutral-800)] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-extrabold">@{providerDisplayName(detail.provider)}</span>
          <span className="tag bg-[#fff2ef] text-[10px] text-[#7c1405]">
            {detail.category}
          </span>
          <span className="tag border border-[var(--color-neutral-700)] text-[10px] text-[var(--color-neutral-300)]">
            Ep {episode}
          </span>
        </div>
        <div className="text-[15px] font-semibold">{detail.title}</div>
        <div className="flex items-center gap-3 text-[12px] text-[var(--color-neutral-400)]">
          <span className="inline-flex items-center gap-1.5">
            <i className="fa-solid fa-eye" />
            {fmtNum(detail.views || 0)} views
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="fa-solid fa-heart text-[var(--color-accent)]" />
            {fmtNum(combinedLikes)} likes
          </span>
        </div>
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
          {detail.episodes.slice(0, 24).map((item) => {
            const active = item.number === episode;
            return (
              <Link
                key={item.id}
                href={`/drama/${provider}/${encodeURIComponent(detail.id)}?ep=${item.number}`}
                className={`ep-chip shrink-0 border px-3 py-1.5 text-xs ${
                  active ? "ep-chip-active" : "ep-chip-idle"
                }`}
              >
                Ep {item.number}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
