import { NextResponse } from "next/server";
import { searchDramas } from "@/lib/dramabos";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const provider = searchParams.get("provider") || undefined;
  const items = await searchDramas(q, provider);
  return NextResponse.json({ items });
}
