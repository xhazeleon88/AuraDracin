import type { DramaCard, DramaDetail, StreamResult } from "./types";

const COVERS = Array.from({ length: 16 }, (_, i) => `/assets/thumbs/v${i + 1}.jpg`);

const TITLES = [
  ["CEO Dingin, Jatuh Cinta", "ceo", "Dia dingin ke semua orang, kecuali ke satu asisten."],
  ["Balas Dendam Sang Pewaris", "balas-dendam", "Diusir dari rumah, dia kembali dengan rencana besar."],
  ["Kembali Demi Cinta", "romance", "Sepuluh tahun berpisah, takdir mempertemukan mereka lagi."],
  ["Pangeran Fantasi Malam", "fantasi", "Ramalan kuno dan cinta yang melanggar semua aturan."],
  ["Cinta Segitiga di Kantor", "ceo", "Dua atasan, satu magang, drama tiap hari."],
  ["Rahasia Keluarga Chen", "keluarga", "Rahasia tiga generasi kebongkar di makan malam."],
  ["Komedi Receh Pengantin Baru", "komedi", "Nikah kontrak yang malah jadi paling receh."],
  ["Misteri Villa Terkutuk", "misteri", "Lima tamu, satu villa, satu yang sudah meninggal."],
  ["Aksi Pembalasan Terakhir", "aksi", "Mantan agen ditarik untuk misi terakhir."],
  ["Dendam Manis Mantan Istri", "balas-dendam", "Diceraikan, lalu kembali jadi CEO yang mereka butuhkan."],
  ["Nikah Kontrak CEO Galak", "ceo", "Kontrak setahun yang bikin jatuh cinta beneran."],
  ["Cinderella Versi Shanghai", "romance", "Barista ketemu pewaris di malam paling aneh."],
  ["Naga Langit Terakhir", "fantasi", "Penjaga klan kuno harus pilih takdir atau cinta."],
  ["Drama Rumah Tangga Palsu", "keluarga", "Pura-pura bahagia di depan investor."],
  ["Sahabat Jadi Cinta", "romance", "Sepuluh tahun temenan, satu pengakuan mengubah segalanya."],
  ["Detektif Cantik Pembasmi Mafia", "misteri", "Detektif muda menyamar demi bongkar mafia kota."],
] as const;

function card(i: number, provider = "starshort"): DramaCard {
  const [title, category, synopsis] = TITLES[i % TITLES.length];
  return {
    id: `demo-${i + 1}`,
    provider,
    title,
    cover: COVERS[i % COVERS.length],
    synopsis,
    episodeCount: 40 + (i % 40),
    category,
    likes: 15000 - i * 700,
    isNew: i % 5 === 0,
    source: "dramabos",
  };
}

export const DEMO_FEED: DramaCard[] = Array.from({ length: 16 }, (_, i) => card(i));

export function getDemoDetail(provider: string, id: string): DramaDetail | null {
  const match = id.match(/^demo-(\d+)$/);
  const index = match ? Number(match[1]) - 1 : DEMO_FEED.findIndex((d) => d.id === id);
  if (index < 0) return null;
  const base = card(index, provider);
  return {
    ...base,
    hashtags: ["dracin", String(base.category), provider],
    episodes: Array.from({ length: Math.min(base.episodeCount || 12, 20) }, (_, ep) => ({
      id: `${base.id}-ep-${ep + 1}`,
      number: ep + 1,
      title: `Episode ${ep + 1}`,
      thumbnail: base.cover,
      locked: ep > 2,
    })),
  };
}

export function getDemoStream(_provider: string, id: string, ep = 1): StreamResult {
  const index = Number(String(id).replace("demo-", "")) - 1 || 0;
  const cover = COVERS[Math.max(0, index) % COVERS.length];
  return {
    // Demo uses portrait stills; real Dramabos returns HLS .m3u8
    url: cover,
    quality: `ep-${ep}`,
    type: "mp4",
  };
}

export function searchDemo(q: string): DramaCard[] {
  const query = q.trim().toLowerCase();
  if (!query) return DEMO_FEED;
  return DEMO_FEED.filter(
    (d) =>
      d.title.toLowerCase().includes(query) ||
      d.synopsis?.toLowerCase().includes(query) ||
      String(d.category).includes(query),
  );
}

export function genreDemo(type: string): DramaCard[] {
  const t = type.toLowerCase();
  const mapped =
    t.includes("revenge") || t.includes("dendam")
      ? "balas-dendam"
      : t.includes("ceo") || t.includes("business")
        ? "ceo"
        : t.includes("fantasy") || t.includes("fantasi")
          ? "fantasi"
          : t.includes("comedy") || t.includes("komedi")
            ? "komedi"
            : t.includes("family") || t.includes("keluarga")
              ? "keluarga"
              : t.includes("action") || t.includes("aksi")
                ? "aksi"
                : t.includes("mystery") || t.includes("misteri") || t.includes("thriller")
                  ? "misteri"
                  : "romance";
  return DEMO_FEED.filter((d) => d.category === mapped);
}
