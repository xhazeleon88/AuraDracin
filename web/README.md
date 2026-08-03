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

## DramaBuzz / DramaBos API

Docs: https://dramabos.live/docs  
Gateway: https://api.dramabuzz.sbs

```env
DRAMABOS_API_KEY=your_access_code
DRAMABOS_BASE_URL=https://api.dramabuzz.sbs
DRAMABOS_DEFAULT_PROVIDER=reelshort
DRAMABOS_LANG=id
```

Implemented API categories:

| Category | Route |
|----------|-------|
| Provider Status | `GET /api/dramabos/status` |
| Feed & Trending | `GET /api/dramabos/feed?type=trending\|latest` |
| Search | `GET /api/dramabos/search?q=ceo&provider=reelshort` |
| Genre & Category | `GET /api/dramabos/genre?type=romance&provider=goodshort` |
| Drama detail | `GET /api/dramabos/detail?provider=reelshort&id=...` |
| Streaming | `GET /api/dramabos/play?provider=goodshort&id=...&ep=1` |
| Download & CDN | `GET /api/dramabos/download?provider=goodshort&id=...` |

Homepage loads ~50 titles from **ReelShort + GoodShort**.  
Watch at `/drama/[provider]/[id]?ep=1`.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Auth.js (NextAuth v5)
- SQLite (`better-sqlite3`)
- HLS.js for `.m3u8` playback
- Font Awesome icons
