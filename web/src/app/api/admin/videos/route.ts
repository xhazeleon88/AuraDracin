import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbFirst, dbRun, slugify } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Local filesystem uploads are unavailable on Cloudflare Workers.
  if (process.env.CLOUDFLARE_WORKERS === "1") {
    return NextResponse.json(
      {
        error:
          "Upload lokal belum tersedia di Cloudflare Workers. Gunakan katalog DramaBos atau aktifkan R2.",
      },
      { status: 501 },
    );
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

  const path = await import("path");
  const fs = await import("fs/promises");
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

  await dbRun(
    `INSERT INTO videos
      (id, admin_id, category, title, slug, description, thumbnail_url, video_url, published, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
    id,
    session.user.id,
    category,
    title,
    slug,
    description,
    publicUrl,
    publicUrl,
  );

  for (const tag of hashtags) {
    const tagSlug = slugify(tag);
    await dbRun(`INSERT OR IGNORE INTO hashtags (id, name, slug) VALUES (?, ?, ?)`, crypto.randomUUID(), tag, tagSlug);
    const row = await dbFirst<{ id: string }>(`SELECT id FROM hashtags WHERE slug = ?`, tagSlug);
    if (row) {
      await dbRun(`INSERT OR IGNORE INTO video_hashtags (video_id, hashtag_id) VALUES (?, ?)`, id, row.id);
    }
  }

  return NextResponse.json({ ok: true, id, slug });
}
