import { NextRequest, NextResponse } from "next/server";
import { getRelatedDramas } from "@/lib/dramabos";
import { mergeLocalLikes } from "@/lib/videos";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider");
  const id = req.nextUrl.searchParams.get("id");
  const category = req.nextUrl.searchParams.get("category") || "romance";
  const limit = Math.max(1, Math.min(12, Number(req.nextUrl.searchParams.get("limit") || 5) || 5));

  if (!provider || !id) {
    return NextResponse.json({ error: "provider & id required" }, { status: 400 });
  }

  try {
    const related = await mergeLocalLikes(
      await getRelatedDramas({ provider, id, category, limit }),
    );
    return NextResponse.json(
      { items: related },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "related gagal";
    return NextResponse.json({ error: message, items: [] }, { status: 500 });
  }
}
