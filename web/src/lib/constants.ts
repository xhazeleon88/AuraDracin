import type { CategorySlug } from "./types";

export const CATEGORIES: { slug: CategorySlug; label: string; icon: string }[] = [
  { slug: "romance", label: "Romance", icon: "fa-heart" },
  { slug: "balas-dendam", label: "Balas Dendam", icon: "fa-fire" },
  { slug: "ceo", label: "CEO / Bisnis", icon: "fa-briefcase" },
  { slug: "fantasi", label: "Fantasi", icon: "fa-wand-magic-sparkles" },
  { slug: "komedi", label: "Komedi", icon: "fa-face-smile" },
  { slug: "keluarga", label: "Keluarga", icon: "fa-house" },
  { slug: "aksi", label: "Aksi", icon: "fa-bolt" },
  { slug: "misteri", label: "Misteri", icon: "fa-magnifying-glass" },
];

export const CITY_OPTIONS = [
  "Jakarta",
  "Surabaya",
  "Bandung",
  "Medan",
  "Semarang",
  "Makassar",
  "Palembang",
  "Tangerang",
  "Depok",
  "Bekasi",
  "Batam",
  "Pekanbaru",
  "Bandar Lampung",
  "Malang",
  "Yogyakarta",
  "Denpasar",
  "Samarinda",
  "Banjarmasin",
  "Pontianak",
  "Manado",
];

export const DRAMABOS_PROVIDERS = [
  "starshort",
  "shortmax",
  "dramabox",
  "idrama",
  "flickreels",
  "reelshort",
  "dramabite",
  "goodshort",
] as const;

export function fmtNum(n: number) {
  if (n >= 1_000_000) {
    const v = (n / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${v.replace(".", ",")}jt`;
  }
  if (n >= 1000) {
    const v = (n / 1000).toFixed(1).replace(/\.0$/, "");
    return `${v.replace(".", ",")}rb`;
  }
  return String(n);
}

export function categoryLabel(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
