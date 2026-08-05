import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbFirst, dbRun } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  city: z.string().min(2).max(100),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.trim().toLowerCase();
    const exists = await dbFirst("SELECT id FROM users WHERE email = ?", email);
    if (exists) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(body.password, 12);
    await dbRun(
      `INSERT INTO users (id, email, password_hash, name, city, role)
       VALUES (?, ?, ?, ?, ?, 'user')`,
      id,
      email,
      hash,
      body.name.trim(),
      body.city,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal daftar" }, { status: 500 });
  }
}
