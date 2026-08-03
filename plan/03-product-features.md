# 03 — Product Features

Feature specification for Aura Dracin MVP, aligned with locked decisions.

---

## User Roles

| Role | Capabilities |
|------|--------------|
| **Visitor (guest)** | Browse homepage, categories, watch videos |
| **User** | All visitor + like, comment, profile (city), auth |
| **Admin** | All user + upload/edit/delete videos, manage metadata |

> **Note:** Only admins upload videos — forever. Users never get upload access.

---

## Homepage — Beranda

URL: `/`

### Sections (top to bottom)

#### 1. Header
- Logo "Aura Dracin"
- Search icon (Phase 2; can be disabled in MVP)
- Login / avatar if authenticated

#### 2. Featured hero (optional MVP)
- 1 featured portrait video, auto-highlighted by admin or highest weekly score
- Title overlay + "Tonton sekarang" CTA

#### 3. 🔥 Lagi Populer
**Label:** `Lagi Populer`  
**Subtitle (optional):** `Yang paling disukai minggu ini`

**Algorithm:**
```
score = (likes_7d × 0.7) + (views_7d × 0.3)
ORDER BY score DESC
LIMIT 20
```

**UI:** Horizontal portrait carousel, 10–20 items

#### 4. 🆕 Terbaru
**Label:** `Terbaru`  
**Subtitle:** `Dracin baru upload`

**Query:** `published_at DESC LIMIT 20`  
**UI:** 2-column portrait grid on mobile

#### 5. 📂 Kategori Cerita
**Label:** `Kategori Cerita`

**Default categories (admin-managed):**

| Slug | Label (BI) |
|------|------------|
| `romance` | Romance |
| `balas-dendam` | Balas Dendam |
| `ceo` | CEO / Bisnis |
| `fantasi` | Fantasi |
| `komedi` | Komedi |
| `keluarga` | Keluarga |
| `aksi` | Aksi |
| `misteri` | Misteri |

**UI:** Horizontal scroll chips → `/kategori/{slug}`

#### 6. 📍 Lagi Rame di Daerahmu
**Label:** `Lagi Rame di {kota}` (dynamic)  
**Example:** `Lagi Rame di Jakarta`

**Logic:**
1. Resolve user city: profile `city` field, else GeoIP city, else hide section
2. Aggregate videos with highest engagement from users in that city (last 7 days)
3. Show top 10 portrait cards

**Fallback:** If city unknown, section hidden (do not show national list under this label)

#### 7. Footer
- Tentang Aura Dracin
- Syarat & Ketentuan
- Kebijakan Privasi
- Kontak

All copy in casual Bahasa Indonesia.

---

## Video Watch Page

URL: `/video/{slug}`

### Layout (portrait-first)
- Full-width 9:16 Cloudflare Stream player
- Title, description (caption), hashtag chips
- Like button + count (auth required)
- Comment section / bottom sheet
- Related videos (same category) — optional Phase 2

### Engagement rules
- **Like:** Toggle; one per user per video; requires login
- **Comment:** Text only, max 1000 chars; author can edit/delete own
- **View:** Increment on play start (debounce 30s per session)

### Guest behavior
- Can watch full video
- Like/comment prompts login modal: "Masuk dulu buat kasih love!"

---

## Authentication

### Sign up
- Email + password (min 8 chars)
- Google OAuth (one-click)
- Optional: display name, city (dropdown of major Indonesian cities)

### Login
- Email + password
- Google OAuth
- "Lupa password?" → email reset link

### No magic links — password only for email auth.

### Profile (`/profil`)
- Display name, avatar (from Google or default)
- City (dropdown — used for "Lagi Rame di Daerahmu")
- Email (read-only)
- Logout

---

## Admin Panel

URL: `/admin` (protected, `role = admin`)

### Dashboard
- Total videos, total views, total users (simple counts)

### Upload video
| Field | Required | Notes |
|-------|----------|-------|
| Video file | Yes | Portrait MP4/MOV; validate 9:16 ±5% tolerance |
| Title | Yes | Max 120 chars |
| Description (caption) | Yes | Max 2000 chars; shown under player |
| Hashtags | Yes | 1–10 tags, autocomplete from existing |
| Category | Yes | Single select from categories |
| Thumbnail | No | Auto-generated from Stream if omitted |
| Published | Yes | Draft vs published toggle |

### Upload flow
1. Admin selects file → client validates portrait ratio
2. Upload to Cloudflare Stream (tus or direct API)
3. Webhook `video.ready` → app saves metadata + stream ID
4. Admin publishes → appears on homepage

### Manage videos
- List all videos (draft + published)
- Edit title, description, hashtags, category
- Unpublish or delete (soft delete preferred)

### No user management in MVP (optional: list users read-only)

---

## Comments

- Flat list (no replies in MVP)
- Sort: newest first
- Display: avatar, name, relative time ("2 jam lalu")
- Report button — Phase 2

---

## SEO & Content (Bahasa Indonesia)

### URL structure
```
/                          → Beranda
/video/{slug}              → Watch page
/kategori/{slug}           → Category listing
/tag/{hashtag}             → Hashtag listing
/masuk                     → Login
/daftar                    → Sign up
```

### Meta title template
```
{video.title} — Nonton Dracin | Aura Dracin
```

### Meta description
First 155 characters of video description (caption).

### Slug generation
Slugify title + short id: `ceo-dingin-jatuh-cinta-a3f2`

### Structured data (JSON-LD)
`VideoObject` with name, description, thumbnailUrl, uploadDate, duration.

---

## Indonesian City List (MVP)

Predefined dropdown for profile + geo aggregation. Start with top 20 cities:

Jakarta, Surabaya, Bandung, Medan, Semarang, Makassar, Palembang, Tangerang, Depok, Bekasi, Batam, Pekanbaru, Bandar Lampung, Malang, Yogyakarta, Denpasar, Samarinda, Banjarmasin, Pontianak, Manado

Expand later based on traffic.

---

## Free Platform — No Monetization

- No ads, subscriptions, or payment flows
- No "premium" badge or locked content
- All published videos are free to watch
