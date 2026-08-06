import { NextResponse } from "next/server";
import { warmHomeSnapshot } from "@/lib/home-cache";

export const dynamic = "force-dynamic";

/**
 * Warm homepage KV snapshot.
 * Called by cron (Bearer CRON_SECRET) or manually after deploys.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const started = Date.now();
  const snap = await warmHomeSnapshot();
  return NextResponse.json({
    ok: true,
    builtAt: snap.builtAt,
    trending: snap.trending.length,
    rails: snap.providerRails.length,
    ms: Date.now() - started,
  });
}

export async function POST(req: Request) {
  return GET(req);
}
