import { getDb } from "./db";
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

function mapVideo(row: VideoRow): LocalVideo {
  const db = getDb();
  const tags = db
    .prepare(
      `SELECT h.name FROM hashtags h
       JOIN video_hashtags vh ON vh.hashtag_id = h.id
       WHERE vh.video_id = ?`,
    )
    .all(row.id) as { name: string }[];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
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

export function listLocalVideos(limit = 20): LocalVideo[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM videos
       WHERE published = 1 AND deleted_at IS NULL
       ORDER BY published_at DESC
       LIMIT ?`,
    )
    .all(limit) as VideoRow[];
  return rows.map(mapVideo);
}

export function listPopularLocal(limit = 20): LocalVideo[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM videos
       WHERE published = 1 AND deleted_at IS NULL
       ORDER BY like_count DESC, view_count DESC
       LIMIT ?`,
    )
    .all(limit) as VideoRow[];
  return rows.map(mapVideo);
}

export function listByCategory(category: string, limit = 40): LocalVideo[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM videos
       WHERE published = 1 AND deleted_at IS NULL AND category = ?
       ORDER BY published_at DESC
       LIMIT ?`,
    )
    .all(category, limit) as VideoRow[];
  return rows.map(mapVideo);
}

export function getLocalBySlug(slug: string): LocalVideo | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT * FROM videos WHERE slug = ? AND published = 1 AND deleted_at IS NULL`,
    )
    .get(slug) as VideoRow | undefined;
  return row ? mapVideo(row) : null;
}

export function getLocalById(id: string): LocalVideo | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM videos WHERE id = ?`).get(id) as VideoRow | undefined;
  return row ? mapVideo(row) : null;
}

export function listCityPopularDramaRefs(
  city: string,
  limit = 12,
): { provider: string; id: string }[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT target_id, COUNT(*) as score
       FROM video_views
       WHERE target_type = 'dramabos' AND city = ?
       GROUP BY target_id
       ORDER BY score DESC
       LIMIT ?`,
    )
    .all(city, limit) as { target_id: string; score: number }[];

  return rows
    .map((row) => {
      const [provider, ...rest] = row.target_id.split(":");
      const id = rest.join(":");
      if (!provider || !id) return null;
      return { provider, id };
    })
    .filter((row): row is { provider: string; id: string } => Boolean(row));
}

/** Add Aura user likes on top of provider API like/view counts. */
export function mergeLocalLikes(cards: DramaCard[]): DramaCard[] {
  if (!cards.length) return cards;
  const db = getDb();
  const targets = cards
    .filter((c) => c.source === "dramabos")
    .map((c) => `${c.provider}:${c.id}`);
  if (!targets.length) return cards;

  const local = new Map<string, number>();
  const chunkSize = 200;
  for (let i = 0; i < targets.length; i += chunkSize) {
    const chunk = targets.slice(i, i + chunkSize);
    const placeholders = chunk.map(() => "?").join(",");
    const rows = db
      .prepare(
        `SELECT target_id, COUNT(*) as c
         FROM likes
         WHERE target_type = 'dramabos' AND target_id IN (${placeholders})
         GROUP BY target_id`,
      )
      .all(...chunk) as { target_id: string; c: number }[];
    for (const row of rows) local.set(row.target_id, row.c);
  }

  return cards.map((card) => {
    if (card.source !== "dramabos") return card;
    const extra = local.get(`${card.provider}:${card.id}`) || 0;
    if (!extra && card.likes) return card;
    return { ...card, likes: (card.likes || 0) + extra };
  });
}

export function countLocalLikes(targetType: "local" | "dramabos", targetId: string) {
  const db = getDb();
  return (
    db
      .prepare(
        `SELECT COUNT(*) as c FROM likes WHERE target_type = ? AND target_id = ?`,
      )
      .get(targetType, targetId) as { c: number }
  ).c;
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
    source: "local",
    slug: video.slug,
  };
}

export function recordView(targetType: "local" | "dramabos", targetId: string, userId?: string | null, city?: string | null) {
  const db = getDb();
  db.prepare(
    `INSERT INTO video_views (id, target_type, target_id, user_id, city)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(crypto.randomUUID(), targetType, targetId, userId || null, city || null);

  if (targetType === "local") {
    db.prepare(`UPDATE videos SET view_count = view_count + 1 WHERE id = ?`).run(targetId);
  }
}
