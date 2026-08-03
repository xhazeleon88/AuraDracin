# Aura Dracin — Locked Decisions Log

All items below are **confirmed** and should be treated as constraints for design and implementation.

---

## 1. Video Hosting — Cloudflare

**Decision:** Use Cloudflare for end-to-end video infrastructure.

| Component | Service | Role |
|-----------|---------|------|
| Object storage | **Cloudflare R2** | Raw upload bucket, backups |
| Transcoding & playback | **Cloudflare Stream** | Portrait HLS delivery, adaptive bitrate |
| CDN | **Cloudflare CDN** | Global edge caching (included with Stream) |

**Implications:**
- Admin uploads go to R2 (presigned URL) or directly to Stream API.
- Stream webhooks notify the app when transcoding is complete.
- Portrait videos are stored and served in 9:16; validate aspect ratio on upload.
- No AWS S3, Mux, or self-hosted HLS in MVP.

---

## 2. Email Authentication — Password

**Decision:** Email sign-up uses **email + password**, not magic links.

**Implications:**
- Auth.js Credentials provider for email/password.
- Password hashing via bcrypt (or Auth.js recommended adapter).
- Forgot-password flow should be included in Phase 1 (email reset token).
- Google OAuth remains as an alternative sign-in method.

---

## 3. Monetization — Free for Now

**Decision:** No payment, subscription, or paywall in MVP or near-term roadmap.

**Implications:**
- No Stripe, payment UI, or premium tiers.
- All videos are freely watchable (account required only for like/comment).
- Architecture should not block future monetization (e.g. avoid hard-coding "all free" in DB enums), but **do not build** payment features now.

---

## 4. Content Uploads — Admin Forever

**Decision:** Only users with `role = admin` can upload videos. Regular users **never** upload.

**Implications:**
- No user upload UI, quotas, or moderation queue for user content.
- Simpler storage policies: only admin-authenticated presigned URLs.
- User-generated content is limited to **comments** (and profile metadata).
- Admin panel is a first-class product surface, not an afterthought.

---

## 5. Geo Discovery — City Level Only

**Decision:** "Lagi Rame di Daerahmu" uses **city** granularity only (not province, district, or GPS).

**Implications:**
- Users optionally set `city` on profile (e.g. Jakarta, Surabaya, Bandung).
- Fallback: infer city from IP via GeoIP (MaxMind or Cloudflare request headers) with low confidence; allow user override.
- Aggregate popularity per `city` for views and likes.
- Homepage section title examples: "Lagi Rame di Jakarta", "Lagi Rame di Surabaya".
- No sub-city regions (kecamatan) in MVP.

---

## Out of Scope (MVP)

- User video uploads
- Paid subscriptions or ads
- Province-level or GPS-precise geo
- Magic-link email auth
- Non-Cloudflare video hosting
- Landscape video support
