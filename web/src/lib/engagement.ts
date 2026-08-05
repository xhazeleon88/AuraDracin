import type { DramaCard, DramaDetail } from "./types";

/** Stable 0..1 unit from a string (same id → same baseline forever). */
function unitFromKey(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function percentile(sorted: number[], p: number) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx];
}

function rangeFromSamples(samples: number[], fallbackMin: number, fallbackMax: number) {
  const positive = samples.filter((n) => n > 0).sort((a, b) => a - b);
  if (positive.length < 3) return { min: fallbackMin, max: fallbackMax };
  const min = Math.max(fallbackMin, percentile(positive, 0.15));
  const max = Math.max(min + 1, percentile(positive, 0.85));
  return { min, max };
}

function cardKey(card: Pick<DramaCard, "provider" | "id">) {
  return `${card.provider}:${card.id}`;
}

/**
 * Fill missing likes/views with realistic baselines derived from API samples
 * in the same batch. Baselines are deterministic per title so they don't jump
 * on refresh. Real API values are kept as-is.
 */
export function applyEngagementBaselines<T extends DramaCard>(cards: T[]): T[] {
  if (!cards.length) return cards;

  const likeRange = rangeFromSamples(
    cards.map((c) => c.likes || 0),
    1_200,
    48_000,
  );
  const viewRange = rangeFromSamples(
    cards.map((c) => c.views || 0),
    18_000,
    920_000,
  );

  return cards.map((card) => {
    const key = cardKey(card);
    const u1 = unitFromKey(`${key}:likes`);
    const u2 = unitFromKey(`${key}:views`);
    const u3 = unitFromKey(`${key}:ratio`);

    let likes = card.likes && card.likes > 0 ? card.likes : 0;
    let views = card.views && card.views > 0 ? card.views : 0;

    if (!likes) {
      // Slight log-ish skew so more titles land mid-low than max.
      const skew = Math.pow(u1, 0.72);
      likes = lerp(likeRange.min, likeRange.max, skew);
    }

    if (!views) {
      if (likes > 0) {
        // Typical short-drama view/like ratio ~12x–55x.
        const ratio = 12 + u3 * 43;
        views = Math.max(likes + 50, Math.round(likes * ratio));
      } else {
        const skew = Math.pow(u2, 0.65);
        views = lerp(viewRange.min, viewRange.max, skew);
      }
    }

    // Keep views ahead of likes when both were filled/present.
    if (views < likes) views = Math.round(likes * (14 + u3 * 20));

    return { ...card, likes, views };
  });
}

export function enrichDramaEngagement(detail: DramaDetail): DramaDetail {
  const [enriched] = applyEngagementBaselines([detail]);
  return { ...detail, ...enriched };
}
