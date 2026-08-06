/** Shared studio/provider display helpers — safe for client components. */

export type StudioProfile = {
  id: string;
  name: string;
  logo: string;
  tagline: string;
  about: string;
  accent: string;
};

/** Full DramaBos / DramaBuzz catalog (status API + dramabos.live/providers). */
export const STUDIO_IDS = [
  "reelshort",
  "goodshort",
  "shortmax",
  "idrama",
  "dramabox",
  "dramawave",
  "netshort",
  "melolo",
  "flickreels",
  "pinedrama",
  "golddrama",
  "freereels",
  "fundrama",
  "microdrama",
  "happyshort",
  "flareflow",
  "dramabite",
  "starshort",
  "vigloo",
  "flextv",
  "bilitv",
  "velolo",
  "stardusttv",
  "serialplus",
  "dotdrama",
  "rapidtv",
  "shortswave",
  "dramanova",
  "cubetv",
  "reelbuzz",
  "moboreels",
  "reelife",
  "raptdrama",
  "bonustv",
  "minitv",
  "bstation",
  "joyreels",
  "kalostv",
  "vibeshort",
  "topdrama",
  "dramaboxv3",
  "storyreel",
  "reelala",
  "anyreel",
  "iqiyi",
] as const;

const BRAND_NAMES: Record<string, string> = {
  reelshort: "ReelShort",
  goodshort: "GoodShort",
  dramabite: "DramaBite",
  pinedrama: "PineDrama",
  golddrama: "Gold Drama",
  flickreels: "FlickReels",
  idrama: "iDrama",
  netshort: "NetShort",
  dramawave: "DramaWave",
  starshort: "StarShort",
  fundrama: "FunDrama",
  microdrama: "MicroDrama",
  vigloo: "Vigloo",
  freereels: "FreeReels",
  shortmax: "ShortMax",
  dramabox: "DramaBox",
  flareflow: "FlareFlow",
  melolo: "Melolo",
  happyshort: "HappyShort",
  flextv: "FlexTV",
  bilitv: "BiliTV",
  velolo: "Velolo",
  stardusttv: "StardustTV",
  serialplus: "Serial+",
  dotdrama: "DotDrama",
  rapidtv: "RapidTV",
  shortswave: "ShortsWave",
  dramanova: "DramaNova",
  cubetv: "CubeTV",
  reelbuzz: "ReelBuzz",
  moboreels: "MoboReels",
  reelife: "Reelife",
  raptdrama: "RaptDrama",
  bonustv: "BonusTV",
  minitv: "MiniTV",
  bstation: "Bstation",
  joyreels: "Joyreels",
  kalostv: "KalosTV",
  vibeshort: "Vibeshort",
  topdrama: "TopDrama",
  dramaboxv3: "DramaBox V3",
  storyreel: "Storyreel",
  reelala: "Reelala",
  anyreel: "Anyreel",
  iqiyi: "iQIYI",
};

const ACCENT_PALETTE = [
  "#E11D48",
  "#DC2626",
  "#F97316",
  "#16A34A",
  "#CA8A04",
  "#FB3867",
  "#2563EB",
  "#0EA5E9",
  "#7C3AED",
  "#DB2777",
  "#EA580C",
  "#9333EA",
  "#0891B2",
  "#65A30D",
  "#B45309",
  "#F43F5E",
  "#EC4899",
  "#F59E0B",
  "#4F46E5",
  "#059669",
];

const STUDIO_COPY: Record<string, { tagline: string; about: string; accent: string }> = {
  reelshort: {
    tagline: "Drama pendek full twist",
    about:
      "ReelShort menghadirkan cerita romance dan revenge yang padat episode. Di AuraDracin, katalog ReelShort bisa kamu tonton tanpa berpindah aplikasi.",
    accent: "#E11D48",
  },
  goodshort: {
    tagline: "Cerita CEO & balas dendam",
    about:
      "GoodShort fokus pada plot bisnis, kontrak nikah, dan konflik keluarga yang bikin nagih. Streaming eksklusif lewat AuraDracin.",
    accent: "#DC2626",
  },
  dramabite: {
    tagline: "Bite-size drama hits",
    about:
      "DramaBite fokus pada episode singkat dengan emosi tinggi. Cocok buat nonton sambil santai di AuraDracin.",
    accent: "#F97316",
  },
  pinedrama: {
    tagline: "Romance yang terasa dekat",
    about:
      "PineDrama fokus pada cerita cinta modern dengan visual hangat. Tonton koleksi PineDrama hanya di AuraDracin.",
    accent: "#16A34A",
  },
  golddrama: {
    tagline: "Kilau cerita premium",
    about:
      "Gold Drama membawa judul-judul berasa premium, dari historical romance sampai drama emosional. Eksklusif streaming di AuraDracin.",
    accent: "#CA8A04",
  },
  flickreels: {
    tagline: "Reel cepat, plot kencang",
    about:
      "FlickReels fokus pada cerita pendek yang langsung masuk konflik. Nikmati katalognya di AuraDracin.",
    accent: "#FB3867",
  },
  idrama: {
    tagline: "Cerita lokal & global",
    about:
      "iDrama menyajikan pilihan drama pendek yang beragam genre. Tersedia untuk ditonton di AuraDracin.",
    accent: "#2563EB",
  },
  netshort: {
    tagline: "Short drama tanpa ribet",
    about:
      "NetShort membawa judul populer dengan pacing cepat. Streaming nyaman lewat AuraDracin.",
    accent: "#0EA5E9",
  },
  dramawave: {
    tagline: "Gelombang cerita baru",
    about:
      "DramaWave rutin menghadirkan judul fresh dengan vibe modern. Saksikan eksklusif di AuraDracin.",
    accent: "#7C3AED",
  },
  starshort: {
    tagline: "Bintang drama pendek",
    about:
      "StarShort menghadirkan kisah cinta dan misteri yang ringkas. Streaming di AuraDracin.",
    accent: "#DB2777",
  },
  fundrama: {
    tagline: "Drama seru tiap episode",
    about:
      "FunDrama penuh twist fantasi dan romance. Koleksinya bisa kamu jelajahi di AuraDracin.",
    accent: "#EA580C",
  },
  microdrama: {
    tagline: "Mikro cerita, makro emosi",
    about:
      "MicroDrama mengemas cerita padat dalam format pendek. Tonton di AuraDracin kapan saja.",
    accent: "#9333EA",
  },
  vigloo: {
    tagline: "Drama Korea-style pendek",
    about:
      "Vigloo dikenal dengan produksi berkualitas dan cerita yang cinematic. Streaming eksklusif di AuraDracin.",
    accent: "#0891B2",
  },
  freereels: {
    tagline: "Reels drama gratis bergaya",
    about:
      "FreeReels menawarkan cerita pendek yang ringan tapi tetap bikin penasaran. Tersedia di AuraDracin.",
    accent: "#65A30D",
  },
  shortmax: {
    tagline: "Maksimal dalam format pendek",
    about:
      "ShortMax membawa drama pendek dengan plot yang langsung to the point. Nonton di AuraDracin.",
    accent: "#E11D48",
  },
  dramabox: {
    tagline: "Kotak penuh cerita",
    about:
      "DramaBox merangkum berbagai genre short drama dalam satu studio. Streaming lewat AuraDracin.",
    accent: "#B45309",
  },
  flareflow: {
    tagline: "Alur cerita yang nyala",
    about:
      "FlareFlow menghadirkan drama pendek dengan energi tinggi. Eksklusif di AuraDracin.",
    accent: "#F43F5E",
  },
  melolo: {
    tagline: "Cerita manis & dramatis",
    about:
      "Melolo fokus pada romance yang emosional. Saksikan judul Melolo di AuraDracin.",
    accent: "#EC4899",
  },
  happyshort: {
    tagline: "Short drama yang ceria",
    about:
      "HappyShort membawa cerita ringan dengan ending yang bikin hati hangat. Tonton di AuraDracin.",
    accent: "#F59E0B",
  },
};

function accentFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENT_PALETTE[hash % ACCENT_PALETTE.length];
}

export function providerDisplayName(id: string) {
  const key = id.toLowerCase();
  if (BRAND_NAMES[key]) return BRAND_NAMES[key];
  if (!key) return id;
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function providerSubtitle(id: string) {
  const name = providerDisplayName(id);
  return `Produksi ${name} · streaming eksklusif di AuraDracin`;
}

export function getStudioProfile(id: string): StudioProfile {
  const key = id.toLowerCase();
  const name = providerDisplayName(key);
  const copy = STUDIO_COPY[key] || {
    tagline: "Studio drama pendek",
    about: `${name} menghadirkan koleksi drama pendek untuk penonton AuraDracin. Jelajahi katalognya di sini.`,
    accent: accentFor(key),
  };
  return {
    id: key,
    name,
    logo: `/studios/${key}.png`,
    tagline: copy.tagline,
    about: copy.about,
    accent: copy.accent,
  };
}

export function listStudioProfiles() {
  return STUDIO_IDS.map((id) => getStudioProfile(id));
}

export function isKnownStudio(id: string) {
  return (STUDIO_IDS as readonly string[]).includes(id.toLowerCase() as (typeof STUDIO_IDS)[number]);
}
