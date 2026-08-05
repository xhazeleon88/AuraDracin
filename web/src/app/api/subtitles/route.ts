import { NextRequest, NextResponse } from "next/server";
import { getStream } from "@/lib/dramabos";
import { getBahasaSubtitles } from "@/lib/subtitles";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider");
  const id = req.nextUrl.searchParams.get("id");
  const ep = Math.max(1, Number(req.nextUrl.searchParams.get("ep") || 1) || 1);

  if (!provider || !id) {
    return NextResponse.json({ error: "provider & id required" }, { status: 400 });
  }

  const stream = await getStream(provider, id, ep);
  if (!stream?.url) {
    return new NextResponse("WEBVTT\n\nNOTE\nStream tidak ditemukan.\n", {
      status: 404,
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  try {
    const { vtt } = await getBahasaSubtitles({
      provider,
      dramaId: id,
      episode: ep,
      streamUrl: stream.url,
    });
    return new NextResponse(vtt, {
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "subtitle gagal";
    return new NextResponse(`WEBVTT\n\nNOTE\n${message}\n`, {
      status: 500,
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
