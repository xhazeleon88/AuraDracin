import { NextResponse } from "next/server";
import { getByGenre } from "@/lib/dramabos";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "romance";
  const provider = searchParams.get("provider") || "reelshort";
  const page = Number(searchParams.get("page") || 1);
  const items = await getByGenre(type, provider, page);
  return NextResponse.json({ items });
}
