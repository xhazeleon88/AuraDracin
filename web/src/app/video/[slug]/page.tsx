import Link from "next/link";
import { notFound } from "next/navigation";
import { EngagementRail } from "@/components/video/Engagement";
import { HlsPlayer } from "@/components/video/HlsPlayer";
import { auth } from "@/lib/auth";
import { categoryLabel } from "@/lib/constants";
import { dbFirst } from "@/lib/db";
import { getLocalBySlug, recordView } from "@/lib/videos";

export const dynamic = "force-dynamic";

export default async function LocalWatchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const video = await getLocalBySlug(slug);
  if (!video) notFound();

  const session = await auth();
  await recordView("local", video.id, session?.user?.id, session?.user?.city);

  const liked = session?.user
    ? Boolean(
        await dbFirst(
          `SELECT 1 as ok FROM likes WHERE user_id = ? AND target_type = 'local' AND target_id = ?`,
          session.user.id,
          video.id,
        ),
      )
    : false;
  const commentRow = await dbFirst<{ c: number }>(
    `SELECT COUNT(*) as c FROM comments WHERE target_type = 'local' AND target_id = ? AND deleted_at IS NULL`,
    video.id,
  );
  const commentCount = commentRow?.c ?? 0;

  const streamType = video.videoUrl.includes(".m3u8") ? "hls" : "mp4";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-neutral-900)] text-[var(--color-neutral-100)]">
      <div className="flex shrink-0 items-center gap-2 px-2 py-1.5">
        <Link
          href="/"
          className="icon-btn !text-white hover:!text-white"
          aria-label="Kembali"
        >
          <i className="fa-solid fa-chevron-left text-xl" />
        </Link>
        <span className="truncate text-[13px] font-semibold text-[var(--color-neutral-100)]">
          {video.title}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="relative h-full max-w-full aspect-[9/16] bg-[var(--color-neutral-800)]">
          <HlsPlayer src={video.videoUrl} poster={video.thumbnailUrl} type={streamType} />
          <EngagementRail
            targetType="local"
            targetId={video.id}
            initialLikes={video.likeCount}
            initialComments={commentCount}
            liked={liked}
          />
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-[var(--color-neutral-800)] px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-extrabold">@admin</span>
          <span className="tag bg-[#fff2ef] text-[10px] text-[#7c1405]">
            {categoryLabel(video.category)}
          </span>
        </div>
        <div className="text-[15px] font-semibold">{video.title}</div>
        <p className="m-0 whitespace-pre-line text-[13px] leading-relaxed text-[var(--color-neutral-400)]">
          {video.description}
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {video.hashtags.map((h) => (
            <span
              key={h}
              className="tag border border-[var(--color-neutral-700)] text-[var(--color-neutral-300)]"
            >
              #{h}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
