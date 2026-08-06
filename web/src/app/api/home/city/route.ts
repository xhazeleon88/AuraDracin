import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getHomeSnapshot } from "@/lib/home-cache";
import { listCityPopularDramaRefs } from "@/lib/videos";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const city = session?.user?.city || "Jakarta";
  const snap = await getHomeSnapshot();
  const cityRefs = await listCityPopularDramaRefs(city, 12);
  const items =
    cityRefs.length > 0
      ? cityRefs
          .map((ref) =>
            snap.trending.find((c) => c.provider === ref.provider && c.id === ref.id),
          )
          .filter(Boolean)
      : snap.trending.slice(8, 20);

  return NextResponse.json(
    { city, items },
    {
      headers: {
        "Cache-Control": "private, max-age=30",
      },
    },
  );
}
