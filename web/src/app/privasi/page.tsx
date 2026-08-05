import type { Metadata } from "next";
import { InfoPage } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
};

export default function PrivasiPage() {
  return (
    <InfoPage title="Kebijakan Privasi">
      <p>
        Privasi kamu penting. Di sini kami jelaskan data apa yang kami proses dan buat
        apa — tanpa bahasa berbelit.
      </p>

      <h2 className="text-[15px] font-extrabold">1. Data yang kami kumpulkan</h2>
      <p>
        Saat daftar atau masuk, kami menyimpan data dasar seperti email, nama, dan
        (opsional) kota. Saat kamu nonton, like, atau komentar, aktivitas itu ikut
        tercatat supaya feed “Lagi Rame di kotamu” dan rekomendasi terasa lebih relevan.
      </p>

      <h2 className="text-[15px] font-extrabold">2. Cara kami memakai data</h2>
      <p>
        Data dipakai untuk menjalankan akun, menampilkan konten, menjaga keamanan, dan
        memperbaiki pengalaman produk. Kami tidak menjual data pribadimu.
      </p>

      <h2 className="text-[15px] font-extrabold">3. Penyimpanan & keamanan</h2>
      <p>
        Kami menyimpan data di sistem Aura Dracin dengan akses terbatas. Password
        di-hash. Meski begitu, tidak ada sistem yang 100% kebal — jadi jaga juga
        keamanan akun di sisi kamu.
      </p>

      <h2 className="text-[15px] font-extrabold">4. Hak kamu</h2>
      <p>
        Kamu bisa meminta koreksi data profil atau penghapusan akun. Untuk permintaan
        terkait privasi, hubungi kami lewat kanal resmi Aura Dracin.
      </p>

      <p className="text-muted text-[12px]">Terakhir diperbarui: Agustus 2026</p>
    </InfoPage>
  );
}
