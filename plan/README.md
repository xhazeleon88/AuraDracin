# Aura Dracin — Product & Technical Plan

**Version:** 1.0  
**Date:** 30 July 2026  
**Status:** Planning (locked decisions applied)

---

## What is Aura Dracin?

A portrait-first video streaming platform for **Dracin** (Drama Cina), built for Indonesian **millennials** and **Gen Z**. All user-facing text and SEO content uses **casual Bahasa Indonesia**. Visitors browse and engage; only **admins** upload content.

---

## Locked Decisions

| Topic | Decision |
|-------|----------|
| **Video hosting** | Cloudflare (R2 storage + Stream delivery) |
| **Email authentication** | Email + password |
| **Monetization** | Free for now |
| **Content uploads** | Admin-only, forever |
| **Geo discovery** | City-level only ("Lagi Rame di Daerahmu") |

---

## Document Index

| File | Contents |
|------|----------|
| [01-brand-identity.md](./01-brand-identity.md) | Name, audience, tone, taglines |
| [02-design-system.md](./02-design-system.md) | Colors, typography, portrait UI patterns |
| [03-product-features.md](./03-product-features.md) | Homepage, admin, user features, SEO copy |
| [04-technical-architecture.md](./04-technical-architecture.md) | Stack, Cloudflare setup, auth, APIs |
| [05-database-schema.md](./05-database-schema.md) | Tables, relationships, indexes |
| [06-implementation-phases.md](./06-implementation-phases.md) | Build order, milestones, checklist |

---

## Quick Summary

```
┌─────────────────────────────────────────────────────────────┐
│  Aura Dracin                                                │
│  Portrait Dracin streaming · Casual Bahasa Indonesia        │
├─────────────────────────────────────────────────────────────┤
│  Admin          → Upload video (title, caption, hashtags)   │
│  Visitors       → Sign up (email/password or Google)        │
│                 → Like & comment on videos                  │
│  Homepage       → Populer · Terbaru · Kategori · Per Kota   │
│  Video format   → Portrait 9:16 only                        │
│  Hosting        → Cloudflare R2 + Stream                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack (at a glance)

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API routes / Server Actions
- **Database:** PostgreSQL (Neon or Supabase)
- **Auth:** Auth.js — email/password + Google OAuth
- **Video:** Cloudflare R2 (storage) + Cloudflare Stream (transcode + CDN)
- **Deploy:** Vercel (app) + Cloudflare (media)

See [04-technical-architecture.md](./04-technical-architecture.md) for full detail.
