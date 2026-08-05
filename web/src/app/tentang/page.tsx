import type { Metadata } from "next";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Tentang Aura Dracin",
};

export default function TentangPage() {
  return (
    <InfoPage title="Tentang Aura Dracin">
      <p>
        Aura Dracin adalah tempat nonton Dracin (Drama Cina) yang dibuat buat millennials
        & Gen Z. Formatnya portrait-first — nyaman ditonton dari HP, kayak lagi scroll
        reel, tapi isinya cerita yang bikin betah.
      </p>
      <p>
        Vibe kami simpel: judul yang lagi rame, episode yang gampang dilanjut, dan
        pengalaman nonton yang terasa dekat. Bukan portal berita. Bukan katalog kaku.
        Ini ruang buat binge dracin tanpa ribet.
      </p>
      <p>
        Nama <strong>Aura Dracin</strong> datang dari situ — nonton dracin, rasain
        auranya. Kalau ada saran atau feedback, tinggal login terus tinggalkan jejak di
        komentar video.
      </p>
      <p className="text-muted text-[12px]">© 2026 Aura Dracin</p>
    </InfoPage>
  );
}
