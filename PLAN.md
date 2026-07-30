# AuraDracin — Product & Technical Plan

A portrait-first video streaming site for Dracin (Drama China) content, written for and about Indonesian Millennials & Gen Z, with all copy/SEO in casual Bahasa Indonesia.

This document is a **plan only** — no implementation yet. It covers brand identity, design system, audience, information architecture, and the technical architecture needed to build the MVP described in the request.

---

## 1. Brand Identity

### 1.1 Name & Positioning

- **Brand name:** `AuraDracin` (already reserved in this repo). Domain-friendly, easy to say, and "Aura" taps into the Gen Z slang trend ("punya aura", "aura points") which pairs naturally with drama-watching culture.
- **Tagline options** (casual, Gen Z/Millennial tone):
  - "Nonton Dracin, Baper Bareng." (main pick — relatable, emotional, communal)
  - "Aura Baper, Aura Dracin."
  - "Drama Cina, Auranya Nempel."
- **Positioning statement:** AuraDracin adalah rumah nonton Dracin buat anak muda Indonesia — tempat baper, ketawa, dan gossip bareng soal drama favorit, dalam format vertikal yang gampang di-scroll kapan aja, di mana aja.

### 1.2 Brand Personality

| Trait | Meaning |
|---|---|
| **Baper-friendly** | Not afraid to lean into the emotional, dramatic, "kesengsem" nature of dracin fandom |
| **Gaul, bukan kaku** | Copy is written like a friend texting, not a corporate press release |
| **Fast & snackable** | Everything optimized for short attention spans — quick captions, punchy hashtags |
| **Komunitas dulu, konten kemudian** | Comments/likes are core to the experience, not an afterthought |

### 1.3 Voice & Copy Guidelines (Bahasa Indonesia gaul)

- Use casual Indonesian, not formal ("nonton" not "menonton", "banget" not "sangat", "gue/lo" or neutral "kamu" depending on context — recommend neutral-friendly "kamu" for wider reach).
- Emojis allowed in UI microcopy but not overused (1 max per line).
- Example microcopy:
  - Empty comment box placeholder: `"Komen dong, jangan cuma nonton doang 👀"`
  - Like button hover/tooltip: `"Kasih aura ke video ini!"`
  - Upload success (admin): `"Video berhasil naik! Siap-siap rame di komen."`
  - Section header examples: `"Lagi Rame Dibahas"` (Popular), `"Baru Nih!"` (Recent), `"Kategori Favorit"` (Categories), `"Ngetren di Daerahmu"` (Popular in your area).
  - SEO meta description example (per video page): `"Nonton [Judul Drama] eps [X] sub Indo, gratis & vertikal di AuraDracin. Baper mulu deh nonton drama satu ini!"`

### 1.4 Logo & Visual Mark (direction, not final asset)

- Wordmark "AuraDracin" with a soft gradient glow ("aura") behind or around the text — evokes both light/energy (aura) and the glowing halo aesthetic common in romantic/palace dracin key art.
- Icon mark option: a rounded play-button merged with a soft radiant ring, usable as a favicon/app icon at small sizes.

---

## 2. Design System

### 2.1 Colour Palette

Portrait video apps live in dark UI (video thumbnails/content need to pop), so the base theme is **dark-mode-first**, accented with a "Chinese drama" palette (imperial red + gold) softened for a modern Gen Z feel (pink/purple gradient accents instead of pure traditional red/gold, so it doesn't feel dated or too formal).

| Token | Hex | Usage |
|---|---|---|
| `bg-base` | `#0F0B14` | App background (near-black plum, not pure black — feels warmer) |
| `bg-surface` | `#1B1421` | Cards, sheets, modals |
| `bg-surface-alt` | `#241A2C` | Nested surfaces, input fields |
| `primary` (Aura Pink) | `#FF3D77` | Primary CTA, active tab, like-button active state |
| `primary-gradient` | `linear-gradient(135deg, #FF3D77 0%, #7F5AF0 100%)` | Story ring, hero highlights, brand gradient |
| `accent-gold` | `#F5B942` | Badges ("Trending", "Baru"), rating stars, premium/imperial drama vibe |
| `accent-red` (Dracin Red) | `#E23B4E` | Live/urgent badges, "Popular" flame icon |
| `text-primary` | `#F5F1F8` | Headlines/body on dark bg |
| `text-secondary` | `#B0A6BC` | Meta text, timestamps, secondary labels |
| `success` | `#3DDC97` | Upload success, confirmations |
| `danger` | `#FF5C5C` | Errors, delete actions |
| `divider` | `#2E2438` | Hairlines, separators |

Light mode is out of scope for MVP (video-first apps overwhelmingly default dark; can revisit later), but tokens above are structured so a light theme could be layered on later.

### 2.2 Typography

- **Display/Headings:** A rounded, friendly geometric sans — e.g. `Poppins` or `Plus Jakarta Sans` (both have great Indonesian/Latin support and a youthful feel, free on Google Fonts).
- **Body/UI:** `Inter` or `Plus Jakarta Sans` (same family as headings, different weights, keeps it simple).
- **Scale:** Mobile-first type scale — 12/14/16/20/24/32px, generous line-height (1.4–1.6) for readability of Indonesian long-form captions.

### 2.3 UI Style Direction

- Reference points: TikTok, ReelShort, DramaBox, IG Reels/Stories — full-bleed vertical video, minimal chrome, thumb-friendly action rail.
- Rounded corners (12–20px radius) on cards/sheets, soft glow/gradient accents rather than hard borders — matches the "Aura" concept.
- Micro-animations: heart "burst" animation on like, gradient shimmer on the Stories/Category rail, skeleton loaders (not spinners) for feed loads.
- Iconography: rounded/filled icon set (e.g. Phosphor Icons "fill" variant or Lucide with custom fill) for a soft, approachable feel.
- Imagery: portrait key-art thumbnails, always 9:16 crop, with a subtle bottom gradient scrim so title/meta text overlaid on thumbnails stays legible.

### 2.4 Portrait-First Layout Principles

Since **all video content is portrait (9:16)**, this drives layout decisions everywhere, not just the player:

- **Thumbnail grid:** 2-column grid of 9:16 cards (like TikTok profile/discover grid), not the 16:9 grid used by YouTube-style sites.
- **Video watch view:** full-screen vertical player (9:16, letterboxed only on very wide/desktop viewports where it's centered with blurred-background fill), swipeable to next video (up/down swipe), TikTok-style right-side action rail (like, comment, share, avatar) overlaid on the video, title/caption/hashtags anchored bottom-left.
- **Desktop adaptation:** center a fixed max-width (e.g. 420px) portrait "phone-like" player column with the rest of the viewport as blurred/dimmed backdrop or side rails for related videos/comments — avoids ugly stretched video on wide screens.
- **Stories/Category rail:** horizontal-scroll circular avatars at the top of the homepage (Instagram Stories-style), each representing a drama category/genre, using the gradient ring token as the "unwatched" indicator.

---

## 3. Target Audience

### 3.1 Primary Audience

- **Age:** 16–35, core 18–27 (Gen Z + young Millennials).
- **Geo:** Indonesia (Tier 1 & Tier 2 cities initially — Jakarta, Bandung, Surabaya, Medan, Makassar, Yogyakarta).
- **Behavior:**
  - Heavy short-form video consumption (TikTok/IG Reels native users).
  - Mobile-first, majority Android, variable network quality → needs adaptive bitrate streaming and low-data-friendly design.
  - Active commenters/"fandom" culture — ship, react, and discuss plot twists in comments.
  - Discover content via hashtags, trending sounds/topics, and social sharing (WA groups, Twitter/X, TikTok edits).

### 3.2 Personas

1. **"Kak Rina", 24, karyawan swasta** — nonton dracin saat commute atau istirahat kerja, suka drama CEO/romance kantoran, aktif komen "gemesin banget" dan share ke grup WA teman kantor.
2. **"Dio, 19, mahasiswa"** — nonton sambil scroll TikTok, suka genre fantasy/wuxia & time travel, follow kategori tertentu, suka konten yang bisa di-swipe cepat kalau bosan.
3. **"Sasa, 27, konten kreator kecil"** — repost cuplikan drama ke media sosial pribadinya, peduli sama caption/hashtag yang catchy supaya gampang di-share ulang.

### 3.3 Content Genres (Category examples)

Romance, CEO/Boss Love, Time Travel, Kerajaan/Palace, Fantasy/Wuxia, Revenge, Modern Drama, Comedy Romance, School/Campus, Sci-Fi — these double as the homepage "Stories" category rail and as filterable hashtag/category taxonomy.

---

## 4. Homepage Information Architecture

Requested homepage modules, in a sensible default order (each is an independently reorderable section server-side, so admin/growth can later A/B test order):

1. **Header / Search bar** — sticky top, brand mark + search (search by title/hashtag).
2. **Category Stories Rail** — horizontal circular avatars per genre/category (tap → filtered vertical feed for that category). This satisfies "story categories."
3. **Trending Now ("Lagi Rame Dibahas")** — Popular videos, ranked by a trending score (see §6.2), horizontal-scroll portrait cards or 2-col grid.
4. **Popular in Your Area ("Ngetren di Daerahmu")** — Popular videos filtered/boosted by the viewer's inferred region (IP-geolocation region, e.g. province/city level — no precise GPS needed), falling back to national trending if the region has too little data.
5. **Recently Added ("Baru Nih!")** — most recent uploads by publish date.
6. **Browse by Category grid** — all categories as tappable chips/cards leading to a filtered feed.
7. **Footer** — about, contact, simple content policy/DMCA notice, social links.

Tapping any video card opens the **full-screen vertical feed/player** starting at that video, and the user can keep swiping through the same list (trending list, category list, etc.) it was opened from.

---

## 5. Core User Flows (MVP scope, matching the request exactly)

### 5.1 Visitor (not logged in)

- Browse homepage sections, open videos, watch, view existing comments/like counts.
- Attempting to like or comment prompts a login/signup modal.

### 5.2 Registered User

- **Sign up / log in** via (a) email + password, or (b) Google OAuth (one-tap).
- Like a video (toggle, one like per user per video).
- Comment on a video (threaded not required for MVP — flat comment list, newest or most-liked first).
- Edit/delete their own comments; report a comment (basic moderation hook for later).
- Manage basic profile (avatar, display name).

### 5.3 Admin

- Log in to a separate `/admin` area (role-gated, not publicly discoverable/linked from the main nav).
- Upload a video: file upload (portrait video), **title**, **description/caption**, **hashtags** (multi-tag input), category/genre selection, optional custom thumbnail (else auto-generated from video frame).
- Video is transcoded/processed (async) then becomes visible on the public site once ready.
- Edit/unpublish/delete existing videos; view basic per-video stats (views, likes, comments count).

No multi-role complexity beyond `admin` vs `user` is needed for this MVP.

---

## 6. Data Model (conceptual)

```
User
  id, email (nullable if Google-only), password_hash (nullable if OAuth-only),
  google_id (nullable), display_name, avatar_url, role [user|admin],
  region (derived at signup/session from IP, optional manual override),
  created_at

Video
  id, title, description, admin_id (uploader),
  category_id, hashtags[] (or via VideoHashtag join table),
  video_url (HLS manifest), thumbnail_url, duration_seconds,
  status [processing|published|unpublished],
  view_count, like_count (denormalized, recalculated/cached), comment_count,
  published_at, created_at

Category
  id, name, slug, icon/cover_image (for the Stories rail)

Hashtag
  id, tag (unique, lowercase)

VideoHashtag (join table: video_id, hashtag_id)

Like
  id, user_id, video_id, created_at (unique constraint on user_id+video_id)

Comment
  id, user_id, video_id, body, created_at, deleted_at (soft delete)

VideoView (or aggregated counters table)
  video_id, region, day, view_count   -- powers "trending" and "popular in your area"
```

### 6.1 Trending / Popularity Scoring

`trending_score = (views_last_72h * w1 + likes_last_72h * w2 + comments_last_72h * w3) / time_decay_factor`

A simple time-decayed weighted score (similar to Reddit "hot" ranking) recalculated periodically (e.g. every 15–30 min via a scheduled job), stored per video for fast homepage reads instead of computing live on every request.

### 6.2 "Popular in Your Area"

- Derive region from the viewer's IP geolocation on each request (country → province/city granularity), no account required.
- Maintain the same trending score but partitioned by region (`VideoView.region`).
- If a region has too few data points (cold start), fall back to national trending so the section is never empty.

---

## 7. Technical Architecture

### 7.1 Stack Recommendation

Given the video-heavy, portrait-streaming nature of this product, the plan leans on **Cloudflare's platform** for storage/streaming/edge delivery (best cost/perf fit for adaptive bitrate portrait video at Indonesia-scale audiences) paired with a standard React/Next.js app:

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | **Next.js (React) + TypeScript** | SSR/SSG for SEO-critical pages (video detail pages need to be crawlable for Google, since SEO in Bahasa Indonesia is a stated goal), file-based routing, great DX |
| Styling | **Tailwind CSS** | Fast to build the dark, gradient-heavy design system as reusable utility classes/tokens |
| Hosting (web) | **Cloudflare Pages / Workers** | Edge-rendered, low latency across Indonesia, integrates natively with the rest of the Cloudflare stack |
| Video storage & streaming | **Cloudflare Stream** | Handles transcoding to adaptive HLS/DASH automatically, built-in player SDK, per-video analytics (views), scales without managing our own transcoding pipeline |
| Object storage (thumbnails, avatars) | **Cloudflare R2** | Cheap, S3-compatible, no egress fees |
| Database | **PostgreSQL** (managed, e.g. Neon/Supabase) accessed via **Cloudflare Hyperdrive** for edge connection pooling, or **Cloudflare D1** if we want to stay fully in the Cloudflare ecosystem for MVP simplicity | Relational data (users/videos/comments/likes) fits SQL well; Hyperdrive+Postgres gives more headroom to scale later, D1 is simplest to start |
| ORM | **Drizzle ORM** or **Prisma** | Type-safe queries matching the data model in §6 |
| Auth | **Auth.js (NextAuth)** with Credentials provider (email+password, hashed via bcrypt/argon2) + Google provider | Both requested auth methods (email, Google) out of the box |
| API layer | Next.js Route Handlers (colocated) for MVP simplicity, or a separate Worker-based API if we want frontend/backend deploy independence | Keeps MVP simple; revisit split if team/scale grows |
| Background jobs (trending score recalculation, view aggregation) | **Cloudflare Cron Triggers (Workers)** | Native scheduled task support, no extra infra |
| Geo for "popular in your area" | **Cloudflare's built-in `request.cf.country` / `region` edge data** | Free, no extra geolocation service needed |
| Image handling (thumbnails/avatars resizing) | **Cloudflare Images** or on-the-fly resizing via Workers | Responsive portrait thumbnails at multiple sizes without pre-generating every variant |
| Analytics | **Cloudflare Web Analytics** (privacy-friendly, free) + custom view/like/comment counters in DB | Lightweight, no cookie banners needed for basic analytics |

> Note: This assumes we lean into the Cloudflare ecosystem, which fits well since transcoding + adaptive HLS delivery for portrait video is the hardest infra problem here and Cloudflare Stream solves it directly. An equally valid alternative is Mux (video API) + AWS S3/CloudFront + Vercel, if the team prefers that ecosystem instead — the app-level architecture (Next.js, Postgres, Auth.js) stays the same either way.

### 7.2 High-Level System Diagram (conceptual)

```
[Admin Browser] --upload video/meta--> [Next.js App on Cloudflare Pages/Workers]
                                                |
                                                v
                                     [API route: create Video record]
                                                |
                        +-----------------------+------------------------+
                        v                                                v
              [Cloudflare Stream]                                [Postgres DB]
       (transcode -> HLS, thumbnail,                         (title, description,
        webhook on "ready")                                   hashtags, category,
                        |                                      status, uploader_id)
                        v
           [Webhook updates Video.status = published]

[Visitor Browser] --GET /-- > [Next.js SSR/Edge] --query--> [Postgres via Hyperdrive/D1]
                                     |
                                     v
                         [Cloudflare Stream Player embeds HLS URL]

[Cron Trigger, every 15 min] -> [Worker: recompute trending_score per video/region] -> [Postgres]
```

### 7.3 Authentication Flow

- Email/password: standard Auth.js Credentials provider, passwords hashed with argon2/bcrypt, email verification optional for MVP (can add later to reduce spam comments).
- Google OAuth: Auth.js Google provider, standard OAuth2 consent flow; first login auto-creates a `User` row with `role=user`.
- Admin accounts are provisioned manually (seeded/flagged in DB) — no public admin signup flow, per the request ("admin to upload videos" implies a controlled, non-public role).
- Session strategy: JWT session (edge-friendly, works well with Cloudflare Workers runtime) via Auth.js.

### 7.4 Video Upload Pipeline (Admin)

1. Admin fills the upload form (title, description, hashtags, category) and selects a video file in the `/admin` panel.
2. Frontend requests a **direct-upload URL** from Cloudflare Stream (via our API), then uploads the file straight to Cloudflare Stream from the browser (avoids routing large files through our own server).
3. On upload completion, Cloudflare Stream transcodes to adaptive HLS and generates a default thumbnail; a webhook notifies our API when the video is `ready`.
4. Our API creates/updates the `Video` row (status `processing` → `published`), attaches hashtags/category, and it becomes visible in the public feeds.
5. Admin can optionally override the auto-thumbnail with a custom portrait image (uploaded to R2/Cloudflare Images).

### 7.5 SEO Plan (Bahasa Indonesia)

- Each video gets a dedicated, server-rendered detail page at a human-readable slug: `/drama/[category]/[video-slug]` (slug derived from title, in Bahasa Indonesia, e.g. `/drama/romance/cinta-terlarang-sang-ceo-eps-1`).
- `<title>` / meta description written in casual Bahasa Indonesia per the voice guide (§1.3), including drama title + episode + "sub Indo" type keywords people actually search.
- Structured data: `VideoObject` JSON-LD schema per video page (thumbnail, uploadDate, description, interactionCount) so Google can surface rich video results.
- Category pages (`/kategori/[slug]`) are also SEO landing pages ("Nonton Drama China Genre Romance Terbaru, Sub Indo").
- Hashtags double as internal tag pages (`/tag/[hashtag]`) for long-tail SEO and cross-linking between related dramas.
- Sitemap.xml + robots.txt generated at build/deploy time, submitted to Google Search Console.

### 7.6 Non-Functional Considerations

- **Performance:** lazy-load feed thumbnails, use Cloudflare Stream's adaptive bitrate so playback adjusts to the viewer's network (important for Indonesian mobile data conditions), preconnect/preload the next video in a swipe feed for near-instant transitions.
- **Moderation:** basic profanity filter + report-comment button for MVP; admin can delete any comment. Rate-limit comment/like submissions per user to curb spam/bots.
- **Accessibility:** captions/subtitles support in the player (dracin content is inherently subtitled — "sub Indo" — so subtitle rendering via Stream's caption support should be planned in from the start).
- **Content licensing:** flag as an open item — streaming Chinese drama content typically requires licensing rights or must be original/licensed uploads; this plan assumes AuraDracin has the legal right to host the uploaded content (either licensed, official, or original), which is an admin/business responsibility outside of this technical plan.
- **Scalability:** stateless Workers + managed Postgres + Cloudflare Stream all scale horizontally without infra management; trending-score precomputation keeps homepage reads cheap even as video/comment volume grows.

---

## 8. MVP Scope Summary (build order)

1. **Foundations:** Next.js + Tailwind scaffold, design tokens (§2), Auth.js (email + Google), Postgres schema (§6) + ORM.
2. **Admin upload flow:** `/admin` login-gated route, upload form → Cloudflare Stream direct upload → Video record with title/description/hashtags/category.
3. **Public video detail/player:** full-screen portrait player with swipe-to-next, like + comment UI (gated by login), SEO-rendered page shell.
4. **Homepage modules:** Stories/category rail, Trending, Recent, Category grid, Popular-in-your-area (region-partitioned trending).
5. **Trending job:** scheduled Worker recomputing scores from views/likes/comments.
6. **Polish pass:** empty states, skeleton loaders, casual-Indonesian microcopy pass across the whole UI, basic moderation tools for admin.

---

## 9. Open Questions for Stakeholder Decision (not blocking the plan, but worth flagging)

- Confirm content sourcing/licensing approach for Dracin videos before launch.
- Confirm whether episodes need series/season grouping (e.g. "Drama X — Eps 1, 2, 3…") in a future iteration, since the current request is single-video-centric (title/description/hashtags per upload) without an explicit "series" entity.
- Confirm whether email verification / password reset flows are required for MVP or can follow in a fast-follow iteration.

This plan is scoped to exactly what was requested: admin upload (title, description, hashtags), visitor signup (email/Google), likes, comments, portrait-first UI, and the four homepage modules (popular, recent, categories, popular-in-your-area). No implementation has been started yet, pending your go-ahead on this plan.
