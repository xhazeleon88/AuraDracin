import { NextResponse } from "next/server";
import { getStream } from "@/lib/dramabos";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  const id = searchParams.get("id");
  const ep = Number(searchParams.get("ep") || 1);
  if (!provider || !id) {
    return NextResponse.json({ error: "provider & id required" }, { status: 400 });
  }
  const stream = await getStream(provider, id, ep);
  if (!stream) return NextResponse.json({ error: "Stream not found" }, { status: 404 });
  return NextResponse.json({ stream });
}
