# Aura Dracin Web

Portrait-first Dracin streaming site for Indonesian millennials & Gen Z.

## Features

- Homepage: Lagi Populer, Terbaru, Kategori Cerita, Lagi Rame di kotamu
- DramaBos API integration for live short-drama catalogs (16 playable providers)
- Auth: email + password (Google optional)
- Likes & comments
- Admin upload (admin-only; local Node only — Workers returns 501 until R2 is wired)
- Portrait 9:16 watch UI with caption pinned below player

## Quick start (local Node)

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

## Deploy to Cloudflare Workers

This app uses [OpenNext](https://opennext.js.org/cloudflare) + D1.

```bash
cd web
# Authenticate once
npx wrangler login

# Set production secrets
npx wrangler secret put AUTH_SECRET
npx wrangler secret put DRAMABOS_API_KEY
npx wrangler secret put ADMIN_PASSWORD

# Optional: set the public URL after first deploy
# npx wrangler secret put AUTH_URL   # https://aura-dracin.<account>.workers.dev

npm run deploy
```

Config lives in `wrangler.jsonc` (Worker name `aura-dracin`, D1 binding `DB`).

Notes for Workers:

| Concern | Behavior |
|---------|----------|
| Database | Cloudflare D1 (`DB`) — not `better-sqlite3` |
| Subtitles (ffmpeg/whisper) | `SUBTITLES_MODE=cache-only` — serves D1 cache / NOTE VTT |
| Local admin uploads | Disabled on Workers until R2 is enabled |
| Image optimization | Workers Images binding |

Preview the Workers runtime locally:

```bash
npm run preview
```

## DramaBuzz / DramaBos API

Docs: https://dramabos.live/docs  
Gateway: https://api.dramabuzz.sbs

```env
DRAMABOS_API_KEY=your_access_code
DRAMABOS_BASE_URL=https://api.dramabuzz.sbs
DRAMABOS_DEFAULT_PROVIDER=reelshort
DRAMABOS_LANG=id
```

Homepage loads playable studio rails (ReelShort + GoodShort featured first).  
Watch at `/drama/[provider]/[id]?ep=1`.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Auth.js (NextAuth v5)
- SQLite locally / Cloudflare D1 on Workers
- `@opennextjs/cloudflare` for Workers hosting
- HLS.js for `.m3u8` playback
- Font Awesome icons
