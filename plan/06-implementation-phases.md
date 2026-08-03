# 06 — Implementation Phases

Build plan for Aura Dracin MVP and beyond.

---

## Phase 1 — Foundation (MVP Core)

**Goal:** Working site where admin uploads portrait Dracin, users sign up and engage, homepage shows all four sections.

### 1.1 Project setup
- [ ] Initialize Next.js 14+ with TypeScript, Tailwind, ESLint
- [ ] Configure design tokens (colors, fonts from `02-design-system.md`)
- [ ] Set up PostgreSQL on Neon + Drizzle/Prisma migrations
- [ ] Deploy skeleton to Vercel

### 1.2 Authentication
- [ ] Auth.js with Credentials (email + password, bcrypt)
- [ ] Google OAuth provider
- [ ] Pages: `/daftar`, `/masuk`, `/lupa-password`
- [ ] Password reset email via Resend
- [ ] Seed first admin user
- [ ] Middleware protecting `/admin/*`

### 1.3 Cloudflare Stream integration
- [ ] Cloudflare account: enable Stream
- [ ] API route: admin upload URL generation
- [ ] Webhook handler: `video.ready` → update DB
- [ ] Portrait aspect ratio validation (client)
- [ ] Stream player component (9:16 full-width)

### 1.4 Admin panel
- [ ] `/admin` dashboard (basic stats)
- [ ] `/admin/upload` — file picker, title, description, hashtags, category
- [ ] `/admin/videos` — list, edit, publish/unpublish, soft delete
- [ ] Hashtag autocomplete from existing tags

### 1.5 Public video pages
- [ ] `/video/[slug]` — player, caption, hashtags, like, comments
- [ ] View tracking with 30s debounce
- [ ] Guest watch (no auth); login prompt for like/comment

### 1.6 Homepage
- [ ] Section: Lagi Populer (7-day score algorithm)
- [ ] Section: Terbaru (published_at desc)
- [ ] Section: Kategori Cerita (chips + `/kategori/[slug]`)
- [ ] Section: Lagi Rame di {kota} (city-level aggregation)
- [ ] Portrait cards + horizontal carousels
- [ ] Mobile-first layout; desktop centered column

### 1.7 Engagement
- [ ] Like toggle (auth required)
- [ ] Comments CRUD (auth required, own edit/delete)
- [ ] Denormalized like_count / view_count

### 1.8 User profile
- [ ] `/profil` — name, avatar, city dropdown
- [ ] City used for "Lagi Rame di Daerahmu"

### 1.9 SEO basics
- [ ] Dynamic meta titles/descriptions (Bahasa Indonesia)
- [ ] `/sitemap.xml`, `/robots.txt`
- [ ] Open Graph tags with portrait thumbnail

**Phase 1 exit criteria:** Admin can upload and publish a portrait video; visitor can sign up (email or Google), watch, like, and comment; homepage shows Populer, Terbaru, Kategori, and city section.

---

## Phase 2 — Discovery & Polish

**Goal:** Better findability, performance, and moderation.

- [ ] Search (title + hashtags) — Postgres full-text or Meilisearch
- [ ] `/tag/[hashtag]` landing pages
- [ ] Related videos on watch page (same category)
- [ ] Comment reporting + admin hide
- [ ] Image lazy loading, skeleton loaders
- [ ] PWA manifest + install prompt
- [ ] Analytics: Plausible or Vercel Analytics
- [ ] Admin: view engagement charts per video

---

## Phase 3 — Growth (post-MVP)

**Goal:** Retention and scale. Only after MVP is stable.

- [ ] Push notifications (new video in favorite category)
- [ ] Email digest ("Dracin baru minggu ini")
- [ ] Swipe-up feed (TikTok-style sequential player)
- [ ] Recommendation engine (collaborative filtering)
- [ ] Expand city list based on analytics
- [ ] Signed Stream URLs (anti-hotlink)
- [ ] CDN cache tuning for homepage API

**Not in roadmap (per decisions):**
- User uploads
- Monetization / payments
- Province-level geo

---

## Milestone Checklist

| # | Milestone | Phase |
|---|-----------|-------|
| M1 | Repo + DB + deploy pipeline | 1 |
| M2 | Auth (email/password + Google) | 1 |
| M3 | Cloudflare Stream upload + playback | 1 |
| M4 | Admin upload flow end-to-end | 1 |
| M5 | Homepage (4 sections) | 1 |
| M6 | Likes + comments | 1 |
| M7 | City-level "Lagi Rame" | 1 |
| M8 | SEO + launch readiness | 1 |
| M9 | Search + tags | 2 |
| M10 | PWA + analytics | 2 |

---

## Pre-Launch Checklist

- [ ] Terms of Service page (casual BI)
- [ ] Privacy Policy (GDPR-friendly, mention Google OAuth)
- [ ] Copyright notice (admin-licensed content only)
- [ ] Rate limiting on auth and comment endpoints
- [ ] Cloudflare Stream webhook signature verification
- [ ] Error monitoring (Sentry)
- [ ] Load test homepage with 100+ videos
- [ ] Test on iOS Safari + Android Chrome (portrait)
- [ ] Lighthouse: performance > 80 mobile

---

## Estimated Component Count (MVP)

| Area | Components |
|------|------------|
| UI primitives | Button, Input, Chip, Badge, Modal, BottomSheet |
| Video | VideoCard, VideoCarousel, StreamPlayer, HashtagList |
| Home | HeroFeatured, PopulerSection, TerbaruSection, KategoriSection, KotaSection |
| Auth | LoginForm, SignupForm, ForgotPasswordForm, GoogleButton |
| Admin | UploadForm, VideoTable, VideoEditForm |
| Layout | Header, Footer, BottomNav, PortraitContainer |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cloudflare Stream upload failures | High | Retry logic; show clear admin error states |
| Portrait video uploaded as landscape | Medium | Client + webhook validation; reject with message |
| City GeoIP inaccurate | Low | User-editable city on profile; hide section if unknown |
| Comment spam | Medium | Rate limits; Phase 2 reporting |
| Copyright on Dracin content | High | Admin-only upload; legal disclaimer; DMCA process |

---

## Next Step After Plan Approval

Begin **Phase 1.1**: scaffold Next.js repo, apply design tokens, run first DB migration, and wire Auth.js skeleton.
