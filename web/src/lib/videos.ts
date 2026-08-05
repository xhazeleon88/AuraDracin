import { dbAll, dbFirst, dbRun } from "./db";
import { applyEngagementBaselines } from "./engagement";
import { toDramaTitleCase } from "./titleCase";
import type { DramaCard, LocalVideo } from "./types";

type VideoRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url: string | null;
  video_url: string | null;
  stream_id: string | null;
  view_count: number;
  like_count: number;
  published: number;
  published_at: string | null;
  created_at: string;
};

async function mapVideo(row: VideoRow): Promise<LocalVideo> {
  const tags = await dbAll<{ name: string }>(
    `SELECT h.name FROM hashtags h
     JOIN video_hashtags vh ON vh.hashtag_id = h.id
     WHERE vh.video_id = ?`,
    row.id,
  );

  return {
    id: row.id,
    slug: row.slug,
    title: toDramaTitleCase(row.title),
    description: row.description,
    category: row.category,
    thumbnailUrl: row.thumbnail_url || "/assets/thumbs/v1.jpg",
    videoUrl: row.video_url || row.thumbnail_url || "/assets/thumbs/v1.jpg",
    streamId: row.stream_id,
    viewCount: row.view_count,
    likeCount: row.like_count,
    published: row.published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    hashtags: tags.map((t) => t.name),
  };
}

export async function listLocalVideos(limit = 20): Promise<LocalVideo[]> {
  const rows = await dbAll<VideoRow>(
    `SELECT * FROM videos
     WHERE published = 1 AND deleted_at IS NULL
     ORDER BY published_at DESC
     LIMIT ?`,
    limit,
  );
  return Promise.all(rows.map(mapVideo));
}

export async function listPopularLocal(limit = 20): Promise<LocalVideo[]> {
  const rows = await dbAll<VideoRow>(
    `SELECT * FROM videos
     WHERE published = 1 AND deleted_at IS NULL
     ORDER BY like_count DESC, view_count DESC
     LIMIT ?`,
    limit,
  );
  return Promise.all(rows.map(mapVideo));
}

export async function listByCategory(category: string, limit = 40): Promise<LocalVideo[]> {
  const rows = await dbAll<VideoRow>(
    `SELECT * FROM videos
     WHERE published = 1 AND deleted_at IS NULL AND category = ?
     ORDER BY published_at DESC
     LIMIT ?`,
    category,
    limit,
  );
  return Promise.all(rows.map(mapVideo));
}

export async function getLocalBySlug(slug: string): Promise<LocalVideo | null> {
  const row = await dbFirst<VideoRow>(
    `SELECT * FROM videos WHERE slug = ? AND published = 1 AND deleted_at IS NULL`,
    slug,
  );
  return row ? mapVideo(row) : null;
}

export async function getLocalById(id: string): Promise<LocalVideo | null> {
  const row = await dbFirst<VideoRow>(`SELECT * FROM videos WHERE id = ?`, id);
  return row ? mapVideo(row) : null;
}

export async function listCityPopularDramaRefs(
  city: string,
  limit = 12,
): Promise<{ provider: string; id: string }[]> {
  const rows = await dbAll<{ target_id: string; score: number }>(
    `SELECT target_id, COUNT(*) as score
     FROM video_views
     WHERE target_type = 'dramabos' AND city = ?
     GROUP BY target_id
     ORDER BY score DESC
     LIMIT ?`,
    city,
    limit,
  );

  return rows
    .map((row) => {
      const [provider, ...rest] = row.target_id.split(":");
      const id = rest.join(":");
      if (!provider || !id) return null;
      return { provider, id };
    })
    .filter((row): row is { provider: string; id: string } => Boolean(row));
}

/**
 * Fill missing API likes/views with stable baselines, then add Aura user likes.
 */
export async function mergeLocalLikes(cards: DramaCard[]): Promise<DramaCard[]> {
  if (!cards.length) return cards;
  const baselined = applyEngagementBaselines(cards);
  const targets = baselined
    .filter((c) => c.source === "dramabos")
    .map((c) => `${c.provider}:${c.id}`);
  if (!targets.length) return baselined;

  const local = new Map<string, number>();
  // D1 (and some SQLite builds) reject queries with too many bound parameters.
  const chunkSize = 50;
  for (let i = 0; i < targets.length; i += chunkSize) {
    const chunk = targets.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => "?").join(",");
    const rows = await dbAll<{ target_id: string; c: number }>(
      `SELECT target_id, COUNT(*) as c
       FROM likes
       WHERE target_type = 'dramabos' AND target_id IN (${placeholders})
       GROUP BY target_id`,
      ...chunk,
    );
    for (const row of rows) local.set(row.target_id, row.c);
  }

  return baselined.map((card) => {
    if (card.source !== "dramabos") return card;
    const extra = local.get(`${card.provider}:${card.id}`) || 0;
    if (!extra) return card;
    return { ...card, likes: (card.likes || 0) + extra };
  });
}

export async function countLocalLikes(targetType: "local" | "dramabos", targetId: string) {
  const row = await dbFirst<{ c: number }>(
    `SELECT COUNT(*) as c FROM likes WHERE target_type = ? AND target_id = ?`,
    targetType,
    targetId,
  );
  return row?.c ?? 0;
}

export function toDramaCard(video: LocalVideo): DramaCard {
  return {
    id: video.id,
    provider: "local",
    title: video.title,
    cover: video.thumbnailUrl,
    synopsis: video.description,
    category: video.category,
    likes: video.likeCount,
    views: video.viewCount,
    source: "local",
    slug: video.slug,
  };
}

export async function recordView(
  targetType: "local" | "dramabos",
  targetId: string,
  userId?: string | null,
  city?: string | null,
) {
  await dbRun(
    `INSERT INTO video_views (id, target_type, target_id, user_id, city)
     VALUES (?, ?, ?, ?, ?)`,
    crypto.randomUUID(),
    targetType,
    targetId,
    userId || null,
    city || null,
  );

  if (targetType === "local") {
    await dbRun(`UPDATE videos SET view_count = view_count + 1 WHERE id = ?`, targetId);
  }
}
