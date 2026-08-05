import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dbFirst, dbRun } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Login dulu" }, { status: 401 });
  }

  const { targetType, targetId } = await req.json();
  if (!targetType || !targetId) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const existing = await dbFirst(
    `SELECT 1 as ok FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?`,
    session.user.id,
    targetType,
    targetId,
  );

  if (existing) {
    await dbRun(
      `DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?`,
      session.user.id,
      targetType,
      targetId,
    );
    if (targetType === "local") {
      await dbRun(
        `UPDATE videos SET like_count = CASE WHEN like_count > 0 THEN like_count - 1 ELSE 0 END WHERE id = ?`,
        targetId,
      );
    }
    return NextResponse.json({ liked: false });
  }

  await dbRun(
    `INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)`,
    session.user.id,
    targetType,
    targetId,
  );
  if (targetType === "local") {
    await dbRun(`UPDATE videos SET like_count = like_count + 1 WHERE id = ?`, targetId);
  }
  return NextResponse.json({ liked: true });
}
