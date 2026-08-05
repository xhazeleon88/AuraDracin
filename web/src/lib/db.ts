import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const dataDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
const configured = process.env.DATABASE_URL?.replace(/^file:/, "");
const resolvedPath = configured
  ? path.isAbsolute(configured)
    ? configured
    : path.join(/*turbopackIgnore: true*/ process.cwd(), configured)
  : path.join(dataDir, "aura-dracin.db");

let db: Database.Database | null = null;

function ensureSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      name TEXT,
      avatar_url TEXT,
      city TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      thumbnail_url TEXT,
      video_url TEXT,
      stream_id TEXT,
      view_count INTEGER NOT NULL DEFAULT 0,
      like_count INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      FOREIGN KEY(admin_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS hashtags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS video_hashtags (
      video_id TEXT NOT NULL,
      hashtag_id TEXT NOT NULL,
      PRIMARY KEY (video_id, hashtag_id),
      FOREIGN KEY(video_id) REFERENCES videos(id),
      FOREIGN KEY(hashtag_id) REFERENCES hashtags(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      user_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, target_type, target_id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS video_views (
      id TEXT PRIMARY KEY,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      user_id TEXT,
      city TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS translation_cache (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      translated TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subtitle_cache (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      drama_id TEXT NOT NULL,
      episode INTEGER NOT NULL,
      stream_url TEXT,
      vtt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ready',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function seedAdmin(database: Database.Database) {
  const email = process.env.ADMIN_EMAIL || "admin@auradracin.com";
  const password = process.env.ADMIN_PASSWORD || "admin123456";
  const existing = database.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return;

  const id = crypto.randomUUID();
  const hash = bcrypt.hashSync(password, 12);
  database
    .prepare(
      `INSERT INTO users (id, email, password_hash, name, city, role)
       VALUES (?, ?, ?, ?, ?, 'admin')`,
    )
    .run(id, email, hash, "Admin Aura Dracin", "Jakarta");
}

export function getDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  db = new Database(resolvedPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  ensureSchema(db);
  seedAdmin(db);
  // Remove old placeholder/demo local videos (image-only fake likes).
  db.prepare(
    `UPDATE videos
     SET deleted_at = datetime('now'), published = 0
     WHERE deleted_at IS NULL
       AND (
         video_url IS NULL
         OR video_url = thumbnail_url
         OR video_url LIKE '/assets/thumbs/%'
       )`,
  ).run();
  return db;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
