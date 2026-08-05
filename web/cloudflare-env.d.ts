/* Cloudflare Workers bindings for Aura Dracin (OpenNext). */
interface CloudflareEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  IMAGES?: ImagesBinding;
  WORKER_SELF_REFERENCE: Fetcher;
  CLOUDFLARE_WORKERS?: string;
  SUBTITLES_MODE?: string;
  DRAMABOS_BASE_URL?: string;
  DRAMABOS_DEFAULT_PROVIDER?: string;
  DRAMABOS_LANG?: string;
  ADMIN_EMAIL?: string;
  AUTH_SECRET?: string;
  AUTH_URL?: string;
  DRAMABOS_API_KEY?: string;
  ADMIN_PASSWORD?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

export {};
