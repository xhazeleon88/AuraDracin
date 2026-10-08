import Link from "next/link";
import { notFound } from "next/navigation";
import { EngagementRail } from "@/components/video/Engagement";
import { LazyHlsPlayer as HlsPlayer } from "@/components/video/LazyHlsPlayer";
import { RelatedDramas } from "@/components/video/RelatedDramas";
import { auth } from "@/lib/auth";
import { runInBackground } from "@/lib/cf";
import { fmtNum } from "@/lib/constants";
import { dbFirst } from "@/lib/db";
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
  const [{ provider, id }, { ep }] = await Promise.all([params, searchParams]);
  const episode = Math.max(1, Number(ep || 1) || 1);
  const dramaId = decodeURIComponent(id);

  const [session, rawDetail] = await Promise.all([
    auth(),
    getDramaDetail(provider, dramaId),
  ]);
  if (!rawDetail) notFound();
  const detail = enrichDramaEngagement(rawDetail);

  const stream = await getStream(provider, detail.id, episode);

  const nextEpisode = detail.episodes.find((item) => item.number === episode + 1);
  const nextHref = nextEpisode
    ? `/drama/${provider}/${encodeURIComponent(detail.id)}?ep=${nextEpisode.number}`
    : undefined;
  const subtitleUrl = stream?.url
    ? `/api/subtitles?provider=${encodeURIComponent(provider)}&id=${encodeURIComponent(detail.id)}&ep=${episode}&v=4`
    : undefined;

  if (stream?.url) {
    void runInBackground(() =>
      getBahasaSubtitles({
        provider,
        dramaId: detail.id,
        episode,
        streamUrl: stream.url,
      }),
    );
  }

  void runInBackground(() =>
    recordView("dramabos", `${provider}:${detail.id}`, session?.user?.id, session?.user?.city),
  );

  const targetId = `${provider}:${detail.id}`;
  const [liked, localLikeCount, commentRow] = await Promise.all([
    session?.user
      ? dbFirst(
          `SELECT 1 as ok FROM likes WHERE user_id = ? AND target_type = 'dramabos' AND target_id = ?`,
          session.user.id,
          targetId,
        ).then((row) => Boolean(row))
      : Promise.resolve(false),
    countLocalLikes("dramabos", targetId),
    dbFirst<{ c: number }>(
      `SELECT COUNT(*) as c FROM comments WHERE target_type = 'dramabos' AND target_id = ? AND deleted_at IS NULL`,
      targetId,
    ),
  ]);
  const combinedLikes = (detail.likes || 0) + localLikeCount;
  const commentCount = commentRow?.c ?? 0;

  return (
    <div className="watch-page flex min-h-0 flex-1 flex-col overflow-hidden bg-black text-white">
      {/* Full-bleed stage: fills phone viewport, letterboxes on desktop */}
      <div className="relative min-h-0 flex-1 bg-black">
        <div className="absolute inset-0 mx-auto h-full w-full max-w-[480px]">
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

          {/* Top overlay: back + title */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start gap-2 px-2 pt-[max(8px,env(safe-area-inset-top))]"
            style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)",
              paddingBottom: 28,
            }}
          >
            <Link
              href="/"
              className="pointer-events-auto mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
              aria-label="Kembali"
            >
              <i className="fa-solid fa-chevron-left text-lg" />
            </Link>
            <div className="min-w-0 flex-1 pt-1.5 pr-2">
              <div className="truncate text-[13px] font-semibold leading-tight text-white drop-shadow">
                {detail.title}
              </div>
              <div className="mt-0.5 text-[11px] text-white/75">
                Ep {episode}
                {detail.episodeCount ? ` / ${detail.episodeCount}` : ""}
              </div>
            </div>
          </div>

          <EngagementRail
            targetType="dramabos"
            targetId={targetId}
            initialLikes={combinedLikes}
            initialComments={commentCount}
            liked={liked}
          />
        </div>
      </div>

      {/* Meta sheet under the player */}
      <div className="max-h-[38vh] shrink-0 space-y-2 overflow-y-auto border-t border-white/10 bg-[var(--color-neutral-900)] px-4 py-3.5 text-[var(--color-neutral-100)]">
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
        <p className="m-0 whitespace-pre-line text-[13px] leading-relaxed text-[var(--color-neutral-400)]">
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

        <RelatedDramas
          provider={provider}
          id={detail.id}
          category={detail.category}
        />
      </div>
    </div>
  );
}
