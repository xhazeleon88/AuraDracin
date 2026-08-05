import { NextResponse } from "next/server";
import { searchCatalog, searchDramas } from "@/lib/dramabos";
import { mergeLocalLikes } from "@/lib/videos";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const provider = searchParams.get("provider");
  const items = mergeLocalLikes(
    provider && provider !== "all"
      ? await searchDramas(q, provider)
      : await searchCatalog(q, 72),
  );
  return NextResponse.json({ items, count: items.length });
}
