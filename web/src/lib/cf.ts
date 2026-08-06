import type { DramaCard } from "./types";

export type CloudflareBindings = {
  DB?: D1Database;
  AURA_CACHE?: KVNamespace;
  NEXT_INC_CACHE_KV?: KVNamespace;
  ASSETS?: Fetcher;
  WORKER_SELF_REFERENCE?: Fetcher;
  IMAGES?: unknown;
};

export async function getCloudflareEnv(): Promise<CloudflareBindings | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    return (ctx?.env as CloudflareBindings | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function getExecutionCtx(): Promise<{ waitUntil?: (p: Promise<unknown>) => void } | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    return (ctx?.ctx as { waitUntil?: (p: Promise<unknown>) => void } | undefined) ?? null;
  } catch {
    return null;
  }
}

/** Fire-and-forget background work on Workers; await on Node. */
export async function runInBackground(task: () => Promise<unknown>) {
  const ctx = await getExecutionCtx();
  if (ctx?.waitUntil) {
    ctx.waitUntil(task().catch(() => undefined));
    return;
  }
  await task().catch(() => undefined);
}

export type HomeSnapshot = {
  version: 1;
  builtAt: number;
  featuredSlides: DramaCard[];
  trending: DramaCard[];
  latest: DramaCard[];
  providerRails: { provider: string; items: DramaCard[] }[];
};

export const HOME_CACHE_KEY = "home:snapshot:v2";
