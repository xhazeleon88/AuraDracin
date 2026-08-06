import bcrypt from "bcryptjs";

const SCHEMA_SQL = `
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
`;

type Stmt = {
  bind(...values: unknown[]): {
    first<T = Record<string, unknown>>(): Promise<T | null>;
    all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
    run(): Promise<unknown>;
  };
};

export type AppDb = {
  prepare(query: string): Stmt;
  exec(query: string): Promise<unknown> | unknown;
};

type LocalSqlite = {
  exec(sql: string): void;
  prepare(sql: string): {
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
    run(...params: unknown[]): unknown;
  };
  pragma(sql: string): unknown;
};

let localDb: LocalSqlite | null = null;
let ready: Promise<AppDb> | null = null;

/** ffmpeg/whisper cannot run on Workers — use Workers AI when available. */
export function subtitlesGenerationEnabled() {
  if (process.env.SUBTITLES_MODE === "cache-only") return false;
  if (process.env.SUBTITLES_MODE === "generate") return true;
  if (process.env.SUBTITLES_MODE === "workers-ai") return false;
  // Default: generate only when not on Cloudflare Workers runtime.
  return process.env.CLOUDFLARE_WORKERS !== "1";
}

async function getD1Binding(): Promise<D1Database | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx?.env as { DB?: D1Database } | undefined;
    return env?.DB ?? null;
  } catch {
    return null;
  }
}

function wrapBetterSqlite(database: LocalSqlite): AppDb {
  return {
    exec(query: string) {
      database.exec(query);
    },
    prepare(query: string) {
      const stmt = database.prepare(query);
      return {
        bind(...values: unknown[]) {
          return {
            async first<T = Record<string, unknown>>() {
              return (stmt.get(...values) as T | undefined) ?? null;
            },
            async all<T = Record<string, unknown>>() {
              return { results: stmt.all(...values) as T[] };
            },
            async run() {
              return stmt.run(...values);
            },
          };
        },
      };
    },
  };
}

async function openLocalSqlite(): Promise<AppDb> {
  if (process.env.CLOUDFLARE_WORKERS === "1") {
    throw new Error("D1 binding `DB` is required on Cloudflare Workers (better-sqlite3 is Node-only).");
  }
  if (localDb) return wrapBetterSqlite(localDb);

  // Keep native module out of the Workers bundle.
  const Database = (
    await import(/* webpackIgnore: true */ "better-sqlite3")
  ).default;
  const fs = await import(/* webpackIgnore: true */ "fs");
  const path = await import(/* webpackIgnore: true */ "path");

  const dataDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
  const configured = process.env.DATABASE_URL?.replace(/^file:/, "");
  const resolvedPath = configured
    ? path.isAbsolute(configured)
      ? configured
      : path.join(/*turbopackIgnore: true*/ process.cwd(), configured)
    : path.join(dataDir, "aura-dracin.db");

  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  const database = new Database(resolvedPath) as unknown as LocalSqlite;
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  localDb = database;
  return wrapBetterSqlite(database);
}

let schemaReady = false;

async function ensureSchema(database: AppDb) {
  if (schemaReady) return;

  if (typeof (database as unknown as D1Database).batch === "function") {
    const statements = SCHEMA_SQL.split(";")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (database as unknown as D1Database).prepare(s));
    await (database as unknown as D1Database).batch(statements);
  } else {
    await Promise.resolve(database.exec(SCHEMA_SQL));
  }

  const email = process.env.ADMIN_EMAIL || "admin@auradracin.com";
  const password = process.env.ADMIN_PASSWORD || "admin123456";
  const existing = await database.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (!existing) {
    const id = crypto.randomUUID();
    // bcrypt.hashSync(cost=12) can exceed Workers CPU limits — use async + lighter cost,
    // or a precomputed hash from ADMIN_PASSWORD_HASH.
    const hash =
      process.env.ADMIN_PASSWORD_HASH ||
      (await bcrypt.hash(password, process.env.CLOUDFLARE_WORKERS === "1" ? 8 : 12));
    await database
      .prepare(
        `INSERT INTO users (id, email, password_hash, name, city, role)
         VALUES (?, ?, ?, ?, ?, 'admin')`,
      )
      .bind(id, email, hash, "Admin Aura Dracin", "Jakarta")
      .run();
  }

  await database
    .prepare(
      `UPDATE videos
       SET deleted_at = datetime('now'), published = 0
       WHERE deleted_at IS NULL
         AND (
           video_url IS NULL
           OR video_url = thumbnail_url
           OR video_url LIKE '/assets/thumbs/%'
         )`,
    )
    .bind()
    .run();

  schemaReady = true;
}

export async function getDb(): Promise<AppDb> {
  if (!ready) {
    ready = (async () => {
      const d1 = await getD1Binding();
      const database = (d1 as unknown as AppDb | null) ?? (await openLocalSqlite());
      await ensureSchema(database);
      return database;
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

export async function dbFirst<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): Promise<T | null> {
  const db = await getDb();
  return db.prepare(sql).bind(...params).first<T>();
}

export async function dbAll<T = Record<string, unknown>>(
  sql: string,
  ...params: unknown[]
): Promise<T[]> {
  const db = await getDb();
  const result = await db.prepare(sql).bind(...params).all<T>();
  return result.results ?? [];
}

export async function dbRun(sql: string, ...params: unknown[]): Promise<void> {
  const db = await getDb();
  await db.prepare(sql).bind(...params).run();
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
