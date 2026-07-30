# Dracinin — Rencana Produk & Teknis

Situs streaming video vertikal khusus **Dracin (Drama Cina)**. Semua konten teks/SEO memakai bahasa Indonesia yang santai. Target utama: **milenial & Gen Z**.

---

## 1. Brand Identity

### 1.1 Nama & Tagline

**Nama utama (rekomendasi): Dracinin**

- Kata "dracin" yang di-verb-kan ala anak muda ("dracinin aja!") — mudah diucapkan, mudah diingat, dan otomatis jadi call-to-action.
- Domain kandidat: `dracinin.com` / `dracinin.id` / `dracinin.tv`.

Alternatif nama (cadangan kalau domain tidak tersedia):

| Nama | Vibe |
|---|---|
| BucinDracin | Sangat Gen Z, main di kata "bucin" (budak cinta) |
| DracinKu | Hangat, personal, aman untuk milenial |
| Nodra | Singkatan "Nonton Drama", pendek & catchy |

**Tagline:** "Bucin dracin? Sini merapat." — alternatif: "Sat set nonton dracin."

### 1.2 Kepribadian Brand (Brand Voice)

- **Santai & akrab** — seperti teman yang suka spill rekomendasi drama, bukan korporat.
- Pakai sapaan "kamu", boleh pakai slang yang sudah umum: *bucin, baper, spill, gemes, gas, sat set, plot twist, red flag/green flag*.
- Emoji dipakai secukupnya di judul section & microcopy (🔥❤️😭), tidak berlebihan.
- Contoh microcopy:
  - Tombol login: "Gas Masuk"
  - Empty state komentar: "Belum ada yang komen. Jadi yang pertama, dong!"
  - Notifikasi like: "Sukak! ❤️"
  - Error 404: "Waduh, halamannya ilang kayak second lead yang gak dipilih 😭"

### 1.3 Audiens

Target utama: **perempuan & laki-laki 18–35 tahun, mobile-first**, terbiasa nonton drama vertikal pendek dari TikTok/ReelShort/DramaBox.

**Persona 1 — "Sinta si Bucin Dracin" (Gen Z, 21, mahasiswi)**
- Nonton di HP sambil rebahan, sesi pendek tapi sering (5–20 menit).
- Menemukan konten dari FYP TikTok & rekomendasi teman.
- Suka komen, tag teman, dan lihat apa yang lagi rame.
- Kebutuhan: player vertikal full-screen, swipe cepat, komentar seru.

**Persona 2 — "Mbak Rara" (Milenial, 31, pekerja kantoran)**
- Nonton saat commute & malam sebelum tidur.
- Lebih suka browsing berdasarkan kategori cerita (CEO, balas dendam, time travel).
- Kebutuhan: kategori jelas, lanjut nonton, kualitas video stabil di jaringan seluler.

Implikasi produk: **mobile-first, video portrait 9:16, feed swipe ala TikTok, section "lagi rame", kategori cerita yang jelas.**

---

## 2. Desain

### 2.1 Warna

Tema **gelap** sebagai default (cocok untuk nonton video, hemat baterai OLED, dan vibe "bioskop di genggaman"). Aksen merah-crimson + emas mengambil nuansa estetika drama Tiongkok (hanfu, lentera, istana) tapi dibawa modern.

| Token | Hex | Pemakaian |
|---|---|---|
| `bg-base` | `#0C0C12` | Latar utama (hampir hitam, sedikit ungu) |
| `bg-elevated` | `#16161F` | Kartu, modal, header |
| `primary` | `#FF3B5C` | Tombol utama, like, badge "Lagi Rame" |
| `primary-hover` | `#E62E4D` | Hover/pressed |
| `accent-gold` | `#F5C451` | Highlight premium, bintang, badge kategori kerajaan |
| `text-primary` | `#F4F4F6` | Teks utama |
| `text-secondary` | `#9A9AAD` | Caption, metadata, timestamp |
| `border` | `#26262F` | Garis pemisah halus |
| `success` | `#3DD68C` | Toast sukses |
| `danger` | `#FF5C5C` | Error, hapus |

Gradient khas brand untuk hero/overlay thumbnail: `#FF3B5C → #B01E6E` (merah ke magenta gelap), dipakai tipis di atas poster agar teks terbaca.

### 2.2 Tipografi

- **Display/heading: Plus Jakarta Sans** (bold/extrabold) — modern, geometris, dan karya desainer Indonesia (cocok dengan identitas lokal).
- **Body/UI: Inter** — keterbacaan tinggi di ukuran kecil.
- Angka statistik (views/likes) pakai tabular numbers.

### 2.3 Prinsip Layout (Portrait-First)

Semua video **9:16**. Seluruh UI dirancang dari asumsi itu:

- **Thumbnail = poster vertikal 9:16** (bukan landscape 16:9). Grid kartu: 2 kolom di mobile, 4–6 kolom di desktop.
- **Halaman nonton (mobile):** player full-screen 9:16 ala TikTok; overlay kanan berisi tombol like ❤️, komentar 💬, share; overlay bawah berisi judul, caption (bisa di-expand), dan hashtag. Swipe atas/bawah = video berikut/sebelumnya.
- **Halaman nonton (desktop):** player portrait di tengah dengan tinggi maksimum `85vh` (`aspect-ratio: 9/16`), latar kiri-kanan pakai blur dari frame video (ambient backdrop). **Panel komentar di sisi kanan** memanfaatkan ruang horizontal yang tersisa — ini kunci agar desktop tidak terasa kosong.
- **Bottom navigation di mobile:** Beranda · Jelajah · (tengah: FYP/feed) · Notifikasi · Profil.

### 2.4 Struktur Homepage

Urutan section (semua judul casual):

1. **Hero / "Lagi Rame Banget 🔥"** — 1 video paling populer minggu ini, poster besar + tombol "Nonton Sekarang".
2. **"Lagi Rame 🔥"** — carousel horizontal video populer (skor popularitas ter-decay waktu).
3. **"Baru Tayang ✨"** — video terbaru urut tanggal upload.
4. **"Populer di Daerahmu 📍"** — trending berdasarkan provinsi penonton (deteksi via IP geolocation, fallback ke trending nasional dengan label "Lagi Rame di Indonesia").
5. **"Pilih Alur Ceritamu 🎭"** — grid kategori cerita, tiap kategori punya warna/ikon:
   - CEO Galak 💼 · Cinta Kontrak 💍 · Balas Dendam 🔪 · Time Travel ⏳ · Kerajaan & Istana 👑 · Dari Miskin Jadi Sultan 💰 · Identitas Rahasia 🎭 · Nikah Dulu, Cinta Belakangan 💌 · Bikin Baper 😭
6. **"Tag Lagi Hits #"** — hashtag terpopuler minggu ini.

### 2.5 SEO (Konten Bahasa Indonesia Santai)

- Semua halaman di-render server-side (SSR) dengan meta title/description bahasa Indonesia santai tapi tetap mengandung kata kunci ("nonton dracin", "drama cina pendek", "dracin sub indo").
- URL slug bahasa Indonesia: `/nonton/{slug-judul}`, `/kategori/{slug}`, `/tag/{hashtag}`.
- Structured data `VideoObject` (JSON-LD) di halaman video; `ItemList` di halaman kategori.
- Open Graph image otomatis dari poster video (dengan template brand).
- `sitemap.xml` + `robots.txt` otomatis.

---

## 3. Rencana Teknis

### 3.1 Ringkasan Arsitektur (Rekomendasi)

**Stack Cloudflare-first** — murah untuk streaming, egress video gratis, dan geolocation bawaan (dipakai fitur "Populer di Daerahmu"):

| Lapisan | Teknologi | Alasan |
|---|---|---|
| Frontend + SSR | **Next.js 15 (App Router) + TypeScript**, deploy ke **Cloudflare Workers** via OpenNext | SSR untuk SEO, satu codebase untuk web + admin |
| Styling | **Tailwind CSS + shadcn/ui** | Cepat, konsisten dengan design token di atas |
| Video | **Cloudflare Stream** | Terima upload, transcode otomatis ke HLS adaptif, dukung portrait, thumbnail otomatis, signed URL |
| Database | **D1 (SQLite) + Drizzle ORM** untuk MVP | Serverless, murah; skema Drizzle mudah dimigrasi ke Postgres (Neon/Hyperdrive) saat traffic besar |
| Auth | **Better Auth** (email+password & Google OAuth) | Modern, jalan di Workers + Drizzle, session cookie httpOnly |
| Gambar (poster custom, avatar) | **R2 + Cloudflare Images** | Resize on-the-fly |
| Cache & rate limit | Workers KV / Cache API | Homepage sections di-cache 1–5 menit |

Alternatif setara (kalau tidak mau Cloudflare): Vercel + Mux Video + Neon Postgres + Auth.js. Keputusan bisa ditukar tanpa mengubah desain skema di bawah.

### 3.2 Skema Data

```
users            id, name, email (unique), password_hash?, google_id?,
                 avatar_url, role ('admin' | 'user'), created_at

videos           id, slug (unique), title, description, status
                 ('processing' | 'published' | 'hidden'),
                 stream_uid (Cloudflare Stream ID), duration_sec,
                 poster_url, category_id, uploaded_by, published_at,
                 view_count (denormalized), like_count, comment_count

categories       id, slug, name, emoji, color        -- kategori cerita
hashtags         id, tag (unique, lowercase tanpa '#')
video_hashtags   video_id, hashtag_id                -- many-to-many

likes            user_id, video_id, created_at       -- PK gabungan (1 like/user/video)
comments         id, video_id, user_id, body, created_at, deleted_at

view_events      id, video_id, user_id?, region_code ('ID-JK', 'ID-JB', ...),
                 country, created_at                  -- sumber data trending & geo

video_region_stats  video_id, region_code, score, window_start
                    -- hasil agregasi terjadwal untuk "Populer di Daerahmu"
```

### 3.3 Alur Upload Video (Admin)

1. Admin buka `/admin/upload`, isi **judul, caption, hashtag** (input bebas, di-parse & dinormalisasi ke lowercase), pilih kategori cerita.
2. Server membuat **direct creator upload URL** dari Cloudflare Stream (tus protocol) → browser upload langsung ke Stream, file besar tidak lewat server kita.
3. Baris `videos` dibuat dengan `status = 'processing'`.
4. **Webhook Stream** menembak endpoint kita saat transcode selesai → simpan `duration`, poster otomatis, ubah `status = 'published'`.
5. Admin juga bisa edit/hide/hapus video dan moderasi komentar dari `/admin`.

Akses admin: kolom `role = 'admin'` + middleware yang memproteksi seluruh route `/admin/*`.

### 3.4 Auth (Pengunjung)

- Daftar/masuk dengan **email + password** atau **Google OAuth** (Better Auth).
- Verifikasi email opsional di MVP (bisa nyusul).
- Tanpa login: bisa nonton semua video. Wajib login untuk **like & komentar** (klik like saat belum login → modal "Gas masuk dulu yuk").

### 3.5 Like, Komentar, View

- **Like:** toggle idempotent (`INSERT ... ON CONFLICT DELETE`-style), optimistic UI, counter denormalized di `videos` untuk sorting cepat.
- **Komentar:** flat list dulu (reply/thread menyusul), rate limit per user (mis. 5 komentar/menit), admin bisa hapus.
- **View:** dihitung saat playback melewati ~3 detik; simpan `view_events` beserta `region_code` dari header geolocation Cloudflare (`request.cf.regionCode`). Dedup kasar per user/IP per video per jam.

### 3.6 Logika "Populer" & "Populer di Daerahmu"

- **Skor populer (time-decayed):**
  `score = (views + 3×likes + 5×comments) / (umur_jam + 2)^1.5`
  → video baru yang engagement-nya tinggi bisa nyalip video lama; dihitung ulang oleh **cron (Workers Cron Trigger) tiap 15 menit** dan disimpan agar query homepage murah.
- **Per daerah:** cron yang sama mengagregasi `view_events` + likes 7 hari terakhir per `region_code` ke `video_region_stats`. Saat request homepage, region penonton dibaca dari header Cloudflare → tampilkan top video region itu; kalau datanya masih sepi (< N video), fallback ke trending nasional.

### 3.7 Peta Halaman

| Route | Isi |
|---|---|
| `/` | Homepage (semua section di §2.4), SSR + cache |
| `/nonton/[slug]` | Player portrait + like/komentar + hashtag; swipe/next ke video terkait |
| `/jelajah` | Feed vertikal full-screen ala FYP (infinite scroll) |
| `/kategori/[slug]` | Grid poster per kategori cerita |
| `/tag/[tag]` | Grid poster per hashtag |
| `/masuk`, `/daftar` | Auth (email + tombol Google) |
| `/profil` | Video yang di-like, kelola akun |
| `/admin` | Dashboard: daftar video, statistik singkat |
| `/admin/upload` | Form upload (judul, caption, hashtag, kategori) |
| `/admin/komentar` | Moderasi komentar |

### 3.8 Tahapan Pengerjaan

1. **Fondasi** — Setup Next.js + Tailwind + shadcn/ui dengan design token brand; Drizzle + skema DB; Better Auth (email & Google); layout dasar + bottom nav.
2. **Pipeline admin** — Role admin, `/admin/upload` dengan direct upload ke Cloudflare Stream, webhook status, CRUD video, parsing hashtag & kategori.
3. **Pengalaman nonton** — Halaman `/nonton/[slug]` (player HLS portrait, desktop layout dengan panel komentar), like & komentar dengan optimistic UI, view tracking + region.
4. **Homepage & discovery** — Section Lagi Rame / Baru Tayang / Kategori / Populer di Daerahmu, cron agregasi skor, halaman kategori & hashtag, feed `/jelajah`.
5. **SEO & polish** — Meta + JSON-LD + sitemap + OG image, empty state & microcopy casual, moderasi komentar, rate limiting, uji beban ringan.

### 3.9 Risiko & Catatan

- **Biaya video** adalah komponen terbesar: Cloudflare Stream menagih per menit tersimpan + per menit ditonton (tanpa biaya egress). Mulai dengan batas resolusi 1080p portrait.
- **Hak cipta konten dracin** perlu dipastikan oleh pemilik situs (lisensi/izin distribusi) — di luar lingkup teknis, tapi penting sebelum publik.
- **"Daerahmu"** berbasis IP tidak selalu akurat (CGNAT/VPN) — selalu sediakan fallback nasional dan jangan tampilkan nama daerah kalau confidence rendah.
- Skema D1 → Postgres: hindari fitur SQLite-spesifik di query supaya migrasi mulus.
