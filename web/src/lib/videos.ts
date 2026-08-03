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

export function listCityPopular(city: string, limit = 12): LocalVideo[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT v.*, COUNT(vw.id) as city_score
       FROM videos v
       LEFT JOIN video_views vw
         ON vw.target_type = 'local' AND vw.target_id = v.id AND vw.city = ?
       WHERE v.published = 1 AND v.deleted_at IS NULL
       GROUP BY v.id
       ORDER BY city_score DESC, v.like_count DESC
       LIMIT ?`,
    )
    .all(city, limit) as VideoRow[];
  return rows.map(mapVideo);
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
