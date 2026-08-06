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

This app uses [OpenNext](https://opennext.js.org/cloudflare) + D1 + KV.

```bash
cd web
npx wrangler login

npx wrangler secret put AUTH_SECRET
npx wrangler secret put DRAMABOS_API_KEY
npx wrangler secret put ADMIN_PASSWORD

npm run deploy

# Warm homepage snapshot (recommended after deploy)
curl https://aura-dracin.<subdomain>.workers.dev/api/cron/warm-home
```

Performance notes:

- Homepage is ISR-cached; search is at `/cari`
- `AURA_CACHE` KV holds a homepage JSON snapshot (SWR)
- `NEXT_INC_CACHE_KV` backs OpenNext incremental cache
- Smart Placement is enabled in `wrangler.jsonc`

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
