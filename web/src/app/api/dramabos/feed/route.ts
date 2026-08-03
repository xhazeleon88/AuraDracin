import { NextResponse } from "next/server";
import { getLatest, getStatus, getTrending } from "@/lib/dramabos";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "trending";
  const provider = searchParams.get("provider") || undefined;
  const page = Number(searchParams.get("page") || 1);

  const status = await getStatus();
  const items =
    type === "latest" ? await getLatest(provider, page) : await getTrending(provider, page);

  return NextResponse.json({ status, items });
}
