# Aura Dracin Web

Portrait-first Dracin streaming site for Indonesian millennials & Gen Z.

## Features

- Homepage: Lagi Populer, Terbaru, Kategori Cerita, Lagi Rame di kotamu
- DramaBos API integration (`https://dramabos.live`) for live short-drama catalogs
- Demo catalog fallback when `DRAMABOS_API_KEY` is empty / API unreachable
- Auth: email + password (Google optional)
- Likes & comments
- Admin upload (admin-only forever)
- Portrait 9:16 watch UI with caption pinned below player

## Quick start

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3000

### Demo admin

- Email: `admin@auradracin.com`
- Password: `admin123456`

## DramaBos API

1. Get a key from https://dramabos.live
2. Set in `.env`:

```env
DRAMABOS_API_KEY=your_token_here
DRAMABOS_DEFAULT_PROVIDER=starshort
DRAMABOS_LANG=id
```

Proxy endpoints:

- `GET /api/dramabos/feed?type=trending|latest`
- `GET /api/dramabos/search?q=ceo`
- `GET /api/dramabos/detail?provider=starshort&id=...`
- `GET /api/dramabos/play?provider=starshort&id=...&ep=1`

Watch Dramabos titles at `/drama/[provider]/[id]?ep=1`.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Auth.js (NextAuth v5)
- SQLite (`better-sqlite3`)
- HLS.js for `.m3u8` playback
- Font Awesome icons
