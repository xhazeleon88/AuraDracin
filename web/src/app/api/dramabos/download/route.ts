import { NextResponse } from "next/server";
import { getDownloadLinks } from "@/lib/dramabos";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  const id = searchParams.get("id");
  if (!provider || !id) {
    return NextResponse.json({ error: "provider & id required" }, { status: 400 });
  }
  const data = await getDownloadLinks(provider, id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}
