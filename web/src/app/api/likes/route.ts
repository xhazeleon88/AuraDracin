import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Login dulu" }, { status: 401 });
  }

  const { targetType, targetId } = await req.json();
  if (!targetType || !targetId) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const db = getDb();
  const existing = db
    .prepare(
      `SELECT 1 FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?`,
    )
    .get(session.user.id, targetType, targetId);

  if (existing) {
    db.prepare(
      `DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?`,
    ).run(session.user.id, targetType, targetId);
    if (targetType === "local") {
      db.prepare(
        `UPDATE videos SET like_count = CASE WHEN like_count > 0 THEN like_count - 1 ELSE 0 END WHERE id = ?`,
      ).run(targetId);
    }
    return NextResponse.json({ liked: false });
  }

  db.prepare(
    `INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)`,
  ).run(session.user.id, targetType, targetId);
  if (targetType === "local") {
    db.prepare(`UPDATE videos SET like_count = like_count + 1 WHERE id = ?`).run(targetId);
  }
  return NextResponse.json({ liked: true });
}
