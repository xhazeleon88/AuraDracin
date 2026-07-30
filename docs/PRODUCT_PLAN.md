# AuraDracin — Product & Technical Plan

> Status: **Planning only** (v1 scope). No implementation in this revision.  
> Language of product copy/SEO: casual Bahasa Indonesia.  
> Content niche: Dracin (Drama Cina).

---

## 1. Brand identity

### Name
**AuraDracin** — already seeded in the repo README.

- **Aura** → vibe, chemistry, “aura” pasangan/aktor, mood episode.  
- **Dracin** → Drama Cina, familiar di komunitas Indo millennial & Gen Z.

### Positioning
Platform short-form / portrait video buat nonton & ngobrolin momen Dracin — bukan Netflix clone, lebih ke “scroll drama vibes” ala Reels/TikTok, tapi fokus khusus Dracin.

**One-liner (ID):**  
*Scroll momen Dracin yang lagi rame. Like, komen, spill vibes.*

**One-liner (internal EN):**  
Portrait-first Dracin clip hub for Indo millennials & Gen Z — watch, like, comment.

### Brand personality
| Trait | Manifestasi |
|---|---|
| Santai & dekat | Copy kayak chat temen: “gue”, “loh”, “banget”, “spill”, “worth it” |
| Drama-aware | Paham tropes: ML cold, second lead syndrome, angst, fluff |
| Visual & cinematic | Highlight momen, ekspresi, chemistry — bukan synopsis panjang |
| Community-first | Komen & like = inti interaksi, bukan cuma playback |

### Voice & tone (Bahasa Indonesia)
- Casual, bukan formal/berita.  
- SEO-friendly tapi tetap human (hindari keyword stuffing).  
- Contoh UI copy:
  - “Video paling rame minggu ini”
  - “Baru di-upload, cek yuk”
  - “Cerita yang lagi naik”
  - “Populer di daerahmu”
  - “Login dulu biar bisa like & komen”

### Brand mark direction
- Wordmark **AuraDracin** sebagai hero signal (bukan cuma nav kecil).  
- Mark opsional: stylized “A” / film-frame siluet vertikal (portrait), bukan play-button generik ungu.  
- Hindari emoji berlebihan di UI.

---

## 2. Audience

### Primary
| Segment | Usia | Perilaku |
|---|---|---|
| Gen Z | ~16–27 | Scroll portrait, comment culture, hashtag discovery, Google/email signup cepat |
| Millennials | ~28–40 | Nostalgia Dracin + series baru, share momen, cari clip spesifik |

### Jobs to be done
1. Cepat nemu clip Dracin yang lagi viral / baru.  
2. Nonton nyaman di HP (portrait full-bleed).  
3. React: like + komen.  
4. Explore by story category & lokalitas (“di daerahmu”).

### Out of scope for v1
- Full episode long-form binge player (landscape cinema mode).  
- Creator marketplace / monetisasi viewer.  
- Live streaming.  
- Multi-language UI (copy tetap ID).

---

## 3. Visual design system

### Design principle: portrait-first
Semua video **9:16**. UI harus:

- Mobile = primary canvas; desktop = centered portrait column (~390–430px) atau multi-column portrait grid, **bukan** wide 16:9 player.  
- Watch page = full-height portrait stage (edge-to-edge di mobile), actions di sisi/kanan atau overlay tipis di bawah (TikTok-like), **tanpa** card frame di hero player.  
- Thumbnails selalu crop/fit 9:16; jangan letterbox hitam lebar di home.  
- Home rows = horizontal snap carousels of portrait posters.

### Color system (cinematic night + warm drama)
Hindari cliché ungu-gradient AI, cream+terracotta, dan dark-purple glow.

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#0B0A0F` | Base background (deep ink) |
| `--ink-elevated` | `#16141C` | Sections / sheets |
| `--mist` | `#EDE6DF` | Primary text |
| `--mist-muted` | `#A89F96` | Secondary text |
| `--cinnabar` | `#C43B3B` | Primary CTA / like active (Chinese-drama red, not neon) |
| `--ember` | `#E8A05A` | Accent highlights, hashtags hover, “hot” badges |
| `--jade` | `#2F6F5E` | Success / “di daerahmu” / location accent |
| `--line` | `rgba(237,230,223,0.12)` | Hairline dividers only when needed |

Atmosphere: subtle grain / soft radial wash (ink → deep wine at edges), bukan flat solid. Imagery = stills aktor/momen drama sebagai visual anchor, bukan abstract blobs.

### Typography
- **Display:** expressive serif or semi-serif dengan karakter “drama poster” (contoh arah: Fraunces / Cormorant-class — final pick saat implement).  
- **UI/body:** clean humanist sans (contoh arah: Manrope / Plus Jakarta Sans — cocok untuk Bahasa Indonesia).  
- Hindari Inter/Roboto/Arial sebagai brand face.  
- Brand wordmark di hero > headline sekunder.

### Motion (2–3 intentional)
1. Home portrait cards: soft scale + fade on enter (stagger ringan).  
2. Like: brief cinnabar pulse / heart fill.  
3. Watch vertical snap: inertia snap between clips (optional v1.1; v1 = single video page + related rail).

### Layout rules (aligned to user design rules)
- First viewport: brand + 1 headline + 1 supporting line + CTA + dominant visual — no stats strip.  
- No cards in hero; cards only where interaction needs a container (e.g. comment composer).  
- One job per section on homepage.

---

## 4. Information architecture & UX

### Visitor (public)
- Home  
- Browse / category  
- Video watch  
- Search (by title / hashtag) — nice-to-have v1 if cheap; else hashtag pages  
- Auth: signup/login (email + Google)

### Authenticated user
- Like / unlike  
- Comment on videos  
- Profile ringan (avatar, nama, komentar sendiri) — minimal v1

### Admin
- Login (role `admin`)  
- Upload video (file) + title + description/caption + hashtags  
- Edit / unpublish / delete  
- Optional: assign story category + region tag (untuk “di daerahmu”)

### Homepage sections (v1)
1. **Hero** — brand AuraDracin + short hook + CTA “Mulai nonton” / “Video rame”.  
2. **Paling populer** — ranked by likes (+ optional comment weight).  
3. **Terbaru** — chronological.  
4. **Kategori cerita** — story categories (chips → category landing).  
5. **Populer di daerahmu** — geo/area-based popular (see tech note below).

Suggested starter categories (editable by admin later):
`Romance`, `Angst`, `Fluff`, `Revenge`, `Office`, `Historical`, `Fantasy`, `Second Lead`, `OST Moment`, `Clip Lucu`

### Watch UI (portrait)
```
┌─────────────────────┐
│   [portrait video]  │  ← full-bleed 9:16
│                     │
│  Title              │
│  caption…  #tags    │
│                     │
│  ♥ 12.4k   💬 832   │
│  ─────────────────  │
│  Comments thread    │
└─────────────────────┘
```
Desktop: centered portrait column + related portrait rail on the side (not a landscape theater).

---

## 5. Functional requirements (v1)

### Auth
- Email + password signup/login (verify email recommended).  
- Google OAuth.  
- Roles: `user` | `admin`.  
- Session-based or JWT cookie; secure httpOnly cookies.

### Videos
- Admin upload → transcode/stream.  
- Fields: `title`, `description` (caption), `hashtags[]`, `categoryId(s)`, `region` (optional), `status` (draft/published), `createdAt`.  
- Enforce/prefer portrait 9:16 (validate aspect ratio on upload or warn).

### Social
- Like: one like per user per video; toggle.  
- Comment: text, timestamps, soft-delete; auth required.  
- Public can read likes count & comments.

### Popularity & feeds
- **Popular:** `score = likes * W1 + comments * W2 + recency_decay`.  
- **Recent:** `ORDER BY created_at DESC`.  
- **Categories:** filter by category.  
- **In your area:**  
  - v1 pragmatic: detect region via IP geolocation (city/province) **or** user-selected area on first visit; show videos tagged with that region OR fallback national popular if sparse.  
  - Admin can tag video with `area` (e.g. Jabodetabek, Bandung, Surabaya) for seeding.

---

## 6. Technical architecture

### Recommended stack (Cloudflare-native)
Fits portrait VOD, Indo audience latency, and simple ops:

| Layer | Choice | Why |
|---|---|---|
| App framework | **Next.js (App Router) on Cloudflare Workers** via OpenNext | SSR/SEO for Bahasa pages, API routes, good DX |
| Video | **Cloudflare Stream** | Upload, encode, HLS/DASH, posters, global delivery |
| DB | **Cloudflare D1** (SQLite) + Drizzle ORM | Users, videos metadata, likes, comments, hashtags |
| File/meta extras | **R2** (optional) | Admin-generated assets, avatars if not using Stream stills |
| Auth | **Better Auth** (or Auth.js) + Google provider + email/password | Fits Workers; credential storage in D1 |
| Geo | Cloudflare `request.cf.region` / `city` | “Populer di daerahmu” without extra geo API |
| Hosting/CDN | Cloudflare Workers + Assets | Same network as Stream |

Alternative if Cloudflare Stream budget is a concern: Mux or Bunny Stream + Postgres (Neon) + Vercel — same app shape, different ops.

### High-level diagram
```
[Browser HP/Desktop]
        │
        ▼
[Next.js on Workers] ── SEO pages, RSC, API
        │
        ├── D1: users, sessions, videos, likes, comments, tags, categories
        ├── Stream: video bytes, playback, thumbnails
        └── Google OAuth + email auth
```

### Data model (sketch)
- `users` — id, name, email, image, role, area_preference, created_at  
- `accounts` / `sessions` — auth tables  
- `videos` — id, stream_uid, title, description, admin_id, category_id, area, status, like_count, comment_count, created_at  
- `hashtags` — id, slug, name  
- `video_hashtags` — video_id, hashtag_id  
- `categories` — id, slug, name, sort  
- `likes` — user_id, video_id, created_at (unique pair)  
- `comments` — id, video_id, user_id, body, created_at, deleted_at  

Denormalize `like_count` / `comment_count` on `videos` for fast home queries; update in transaction on like/comment.

### Upload flow (admin)
1. Admin authenticated → Admin Upload page.  
2. Client requests **direct upload URL** from Stream (via server route using Stream API token).  
3. Browser uploads file to Stream.  
4. Webhook or poll: when `ready`, save `stream_uid` + metadata to D1, status `published`.  
5. Playback via Stream HLS or Stream Player API in custom portrait UI.

### API surface (minimal)
- `POST /api/auth/*` — signup, login, Google callback  
- `GET /api/videos?sort=popular|recent&category=&area=`  
- `GET /api/videos/:id`  
- `POST /api/admin/videos/upload-url`  
- `POST /api/admin/videos` — attach metadata  
- `PATCH/DELETE /api/admin/videos/:id`  
- `POST /api/videos/:id/like` · `DELETE` unlike  
- `GET/POST /api/videos/:id/comments`

### SEO (Bahasa Indonesia)
- SSR/SSG for home, category, video pages.  
- Titles like: `{title} — Clip Dracin | AuraDracin`  
- Meta description dari caption (dipotong, natural).  
- Semantic URLs: `/v/[slug]`, `/kategori/[slug]`, `/tag/[slug]`.  
- Open Graph pakai Stream thumbnail (portrait).  
- Sitemap + robots.

### Security
- Admin routes middleware (role check).  
- Rate-limit likes/comments (Workers + KV or D1 counters).  
- Sanitize comment HTML (plain text only v1).  
- CSRF on mutations; secure cookies.  
- Stream signed URLs / tokenized playback if content should not be hotlinkable (decide per licensing needs).

---

## 7. Page inventory (v1)

| Route | Purpose |
|---|---|
| `/` | Home sections |
| `/v/[slug]` | Watch + comments |
| `/kategori/[slug]` | Category grid |
| `/tag/[slug]` | Hashtag grid |
| `/masuk` · `/daftar` | Auth |
| `/akun` | Light profile |
| `/admin` | Dashboard |
| `/admin/videos/new` | Upload form |
| `/admin/videos` | Manage list |

---

## 8. Build phases

### Phase 0 — Foundations
- Next.js + Workers project scaffold, design tokens, layout shell, brand home placeholder.  
- D1 schema + Drizzle migrations.  
- Auth (email + Google) + role seed for admin.

### Phase 1 — Catalog & playback
- Admin upload → Stream → publish metadata.  
- Portrait watch page + home Recent / Popular.  
- Categories + hashtags.

### Phase 2 — Social
- Likes + comments.  
- Counts on cards & watch page.

### Phase 3 — Local popular
- Area tagging + CF geo / user preference.  
- “Populer di daerahmu” section + empty-state fallback.

### Phase 4 — Polish
- SEO content pass (ID casual).  
- Motion, empty states, moderation basics (delete comment as admin).  
- Analytics (Cloudflare Web Analytics / privacy-light events).

---

## 9. Success metrics (early)
- DAU / WAU returning watchers  
- Likes per video, comments per video  
- Signup conversion from watch CTA  
- % traffic mobile  
- Watch time / play-through on portrait clips  

---

## 10. Open decisions (resolve at build start)
1. Final typefaces (license: Google Fonts vs self-host).  
2. Stream signed playback vs public embeds.  
3. Email provider for verification (Resend / Mailchannels).  
4. Whether users pick area manually vs pure IP geo.  
5. Comment nesting (v1 flat thread recommended).

---

## 11. Explicit non-goals (for now)
- Landscape cinema mode  
- Subscriptions / paywall  
- User-generated video uploads (admin-only uploads)  
- Mobile native apps  
- AI recommendations (popularity + category + area is enough)

---

*Next step after approval: implement Phase 0 scaffold on branch and iterate phases 1–3.*
