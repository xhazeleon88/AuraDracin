import type { Metadata } from "next";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
};

export default function SyaratPage() {
  return (
    <InfoPage title="Syarat & Ketentuan">
      <p>
        Dengan memakai Aura Dracin, kamu setuju dengan syarat berikut. Ringkas aja —
        biar jelas tanpa basa-basi panjang.
      </p>

      <h2 className="text-[15px] font-extrabold">1. Akun & akses</h2>
      <p>
        Kamu bertanggung jawab atas akun yang kamu buat. Jangan bagikan password.
        Konten di platform ini ditujukan untuk hiburan pribadi, bukan untuk dijual
        ulang atau didistribusikan ulang tanpa izin.
      </p>

      <h2 className="text-[15px] font-extrabold">2. Konten</h2>
      <p>
        Drama dan video yang tampil bisa berasal dari katalog mitra atau upload admin
        Aura Dracin. Ketersediaan judul, kualitas stream, dan subtitle bisa berubah
        sewaktu-waktu. Kami berusaha menjaga pengalaman nonton tetap mulus, tapi
        gangguan teknis kadang bisa terjadi.
      </p>

      <h2 className="text-[15px] font-extrabold">3. Interaksi</h2>
      <p>
        Like, komentar, dan share harus tetap sopan. Konten yang mengandung ujaran
        kebencian, spam, atau pelecehan bisa dihapus, dan akun yang bermasalah bisa
        dibatasi.
      </p>

      <h2 className="text-[15px] font-extrabold">4. Perubahan</h2>
      <p>
        Syarat ini bisa diperbarui. Kalau ada perubahan penting, kami akan menampilkannya
        di halaman ini. Lanjut pakai Aura Dracin setelah update berarti kamu setuju
        dengan versi terbaru.
      </p>

      <p className="text-muted text-[12px]">Terakhir diperbarui: Agustus 2026</p>
    </InfoPage>
  );
}
