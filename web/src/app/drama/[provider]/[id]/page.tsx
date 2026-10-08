import Link from "next/link";
import { notFound } from "next/navigation";
import { EngagementRail } from "@/components/video/Engagement";
import { LazyHlsPlayer as HlsPlayer } from "@/components/video/LazyHlsPlayer";
import { WatchInfoSheet } from "@/components/video/WatchInfoSheet";
import { auth } from "@/lib/auth";
import { runInBackground } from "@/lib/cf";
import { dbFirst } from "@/lib/db";
import { getDramaDetail, getStream } from "@/lib/dramabos";
import { enrichDramaEngagement } from "@/lib/engagement";
import { getBahasaSubtitles } from "@/lib/subtitles";
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
      {/* Immersive stage — fills the phone viewport */}
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

          {/* Minimal top chrome */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start gap-2 px-2 pt-[max(8px,env(safe-area-inset-top))]"
            style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
              paddingBottom: 36,
            }}
          >
            <Link
              href="/"
              className="pointer-events-auto mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
              aria-label="Kembali"
            >
              <i className="fa-solid fa-chevron-left text-lg" />
            </Link>
          </div>

          <EngagementRail
            targetType="dramabos"
            targetId={targetId}
            initialLikes={combinedLikes}
            initialComments={commentCount}
            liked={liked}
          />

          <WatchInfoSheet
            provider={provider}
            dramaId={detail.id}
            title={detail.title}
            category={detail.category || ""}
            synopsis={detail.synopsis || ""}
            hashtags={detail.hashtags || []}
            views={detail.views || 0}
            likes={combinedLikes}
            episode={episode}
            episodeCount={detail.episodeCount}
            episodes={detail.episodes}
          />
        </div>
      </div>
    </div>
  );
}
