import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { getDb, slugify } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  const category = String(form.get("category") || "romance").trim();
  const hashtags = String(form.get("hashtags") || "")
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 10);
  const file = form.get("file");

  if (!title || !description || !(file instanceof File)) {
    return NextResponse.json({ error: "Data kurang lengkap" }, { status: 400 });
  }

  const ext = path.extname(file.name || "").toLowerCase() || ".mp4";
  const allowed = [".mp4", ".webm", ".jpg", ".jpeg", ".png", ".webp"];
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: "Format file tidak didukung" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const baseSlug = slugify(title) || "video";
  const slug = `${baseSlug}-${id.slice(0, 6)}`;
  const fileName = `${slug}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, fileName), buffer);

  const publicUrl = `/uploads/${fileName}`;
  const db = getDb();

  db.prepare(
    `INSERT INTO videos
      (id, admin_id, category, title, slug, description, thumbnail_url, video_url, published, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
  ).run(id, session.user.id, category, title, slug, description, publicUrl, publicUrl);

  const insertTag = db.prepare(`INSERT OR IGNORE INTO hashtags (id, name, slug) VALUES (?, ?, ?)`);
  const getTag = db.prepare(`SELECT id FROM hashtags WHERE slug = ?`);
  const linkTag = db.prepare(
    `INSERT OR IGNORE INTO video_hashtags (video_id, hashtag_id) VALUES (?, ?)`,
  );

  for (const tag of hashtags) {
    const tagSlug = slugify(tag);
    insertTag.run(crypto.randomUUID(), tag, tagSlug);
    const row = getTag.get(tagSlug) as { id: string };
    linkTag.run(id, row.id);
  }

  return NextResponse.json({ ok: true, id, slug });
}
