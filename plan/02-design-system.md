# 02 — Design System

Portrait-first design system for Aura Dracin. All layouts assume **9:16** as the canonical video aspect ratio.

---

## Design Principles

1. **Portrait is default** — thumbnails, player, and cards are vertical (9:16).
2. **Thumb-zone actions** — like, comment, share within easy one-handed reach (right rail or bottom bar).
3. **Cinema dark** — dark backgrounds reduce eye strain for long sessions.
4. **Content forward** — UI chrome stays minimal during playback.
5. **Casual clarity** — labels in Bahasa Indonesia gaul; icons universal where possible.

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary` | `#E91E8C` | CTAs, active like, links, brand accent |
| `--color-primary-hover` | `#D1187D` | Button hover |
| `--color-secondary` | `#F5C542` | "Populer" badges, stars, highlights |
| `--color-accent` | `#22D3EE` | "Baru" badges, info states |
| `--color-bg` | `#0D0D0F` | App background |
| `--color-surface` | `#1A1A1F` | Cards, modals, input fields |
| `--color-surface-elevated` | `#25252D` | Hover states, dropdowns |
| `--color-text-primary` | `#F5F5F7` | Headings, titles |
| `--color-text-secondary` | `#9CA3AF` | Captions, timestamps, metadata |
| `--color-border` | `#2D2D35` | Dividers, input borders |
| `--color-error` | `#EF4444` | Form errors, destructive actions |
| `--color-success` | `#22C55E` | Success toasts |

### Semantic usage

- **Like (active):** `#E91E8C` filled heart
- **Like (inactive):** `#9CA3AF` outline heart
- **Popular badge:** `#F5C542` background, `#0D0D0F` text
- **New badge:** `#22D3EE` background, `#0D0D0F` text

---

## Typography

| Role | Font | Weight | Size (mobile) |
|------|------|--------|---------------|
| Display / Logo | Plus Jakarta Sans | 700 | 24px |
| H1 (page title) | Plus Jakarta Sans | 700 | 22px |
| H2 (section) | Plus Jakarta Sans | 600 | 18px |
| Body | Inter | 400 | 15px |
| Caption / meta | Inter | 400 | 13px |
| Button | Inter | 600 | 15px |

**Line height:** 1.5 body, 1.2 headings  
**Fallback stack:** `system-ui, -apple-system, sans-serif`

---

## Spacing & Layout

| Token | Value |
|-------|-------|
| Base unit | 4px |
| Screen padding | 16px |
| Section gap | 24px |
| Card gap (grid) | 12px |
| Touch target min | 44×44px |

### Portrait dimensions

| Element | Aspect | Notes |
|---------|--------|-------|
| Video player | 9:16 | Full viewport width on mobile |
| Thumbnail card | 9:16 | `aspect-ratio: 9/16` |
| Hero featured | 9:16 | Max height ~70vh |
| OG image crop | 9:16 center | For social shares |

### Desktop behavior

- Max content column: **430px** centered (phone-like)
- Optional wider homepage grids: 2–3 portrait columns
- Player remains portrait-centered, letterboxed on wide screens

---

## Components

### Portrait video card

```
┌──────────┐
│          │
│  thumb   │  9:16
│          │
│ ▓▓▓▓▓▓▓▓ │  gradient overlay bottom
│ Judul    │
│ ❤ 1.2k   │
└──────────┘
```

- Rounded corners: `12px`
- Duration badge: top-right, `#00000099` background
- Title: max 2 lines, ellipsis

### Horizontal carousel (Lagi Populer)

- Scroll-snap horizontal
- Card width: ~140px on mobile
- Peek next card (~16px visible) to invite scroll

### Category chips

- Pill shape, `border-radius: 9999px`
- Inactive: surface bg + border
- Active: primary bg + white text
- Horizontal scroll, no wrap

### Video player (full screen)

```
┌─────────────────────┐
│ ← back              │
│                     │
│     VIDEO 9:16      │
│                     │
│              ❤️ 1.2k│  right action rail
│              💬  89 │
│              ↗️     │
│─────────────────────│
│ @admin · #dracin    │
│ Caption text here.. │
└─────────────────────┘
```

- Tap video: play/pause
- Comments: bottom sheet (70vh), drag to dismiss

### Bottom navigation (mobile)

| Icon | Label |
|------|-------|
| Home | Beranda |
| Categories | Kategori |
| (none center) | — |
| Profile | Profil |

---

## Iconography

- Style: Lucide Icons or Heroicons (outline, 24px)
- Filled variants for active states (heart, home)

---

## Motion

| Interaction | Animation |
|-------------|-----------|
| Like tap | Heart scale 1 → 1.3 → 1 (200ms) |
| Page transition | Fade 150ms |
| Bottom sheet | Slide up 300ms ease-out |
| Carousel | Native scroll-snap, no JS autoplay on MVP |

---

## Accessibility

- Minimum contrast ratio 4.5:1 for body text on dark bg
- Focus rings: `2px solid #22D3EE`
- Video player: keyboard play/pause, visible focus on controls
- Alt text on thumbnails from video title
