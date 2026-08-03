import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");
  if (!targetType || !targetId) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.id, c.body, c.created_at, u.name
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.target_type = ? AND c.target_id = ? AND c.deleted_at IS NULL
       ORDER BY c.created_at DESC
       LIMIT 100`,
    )
    .all(targetType, targetId) as {
    id: string;
    body: string;
    created_at: string;
    name: string;
  }[];

  return NextResponse.json({
    comments: rows.map((r) => ({
      id: r.id,
      body: r.body,
      name: r.name || "User",
      createdAt: r.created_at,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Login dulu" }, { status: 401 });
  }

  const { targetType, targetId, body } = await req.json();
  if (!targetType || !targetId || !body?.trim()) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO comments (id, user_id, target_type, target_id, body)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, session.user.id, targetType, targetId, String(body).slice(0, 1000));

  return NextResponse.json({ ok: true, id });
}
