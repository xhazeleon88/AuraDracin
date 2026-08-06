/* Minimal Cloudflare binding types used by Aura Dracin (avoid pulling workers-types into Next DOM). */

declare global {
  interface D1Result<T = unknown> {
    results: T[];
    success: boolean;
    meta?: Record<string, unknown>;
  }

  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
    run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
    all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
    raw<T = unknown[]>(): Promise<T[]>;
  }

  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    dump(): Promise<ArrayBuffer>;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    exec(query: string): Promise<D1Result>;
  }

  interface Fetcher {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  }

  interface KVNamespace {
    get(key: string, type?: "text"): Promise<string | null>;
    get(key: string, type: "json"): Promise<unknown>;
    get(key: string, type: "arrayBuffer"): Promise<ArrayBuffer | null>;
    get(key: string, type: "stream"): Promise<ReadableStream | null>;
    put(
      key: string,
      value: string | ArrayBuffer | ArrayBufferView | ReadableStream,
      options?: { expirationTtl?: number; expiration?: number; metadata?: unknown },
    ): Promise<void>;
    delete(key: string): Promise<void>;
  }

  // Minimal stub — OpenNext DO queue owns the real type.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface DurableObjectNamespace {}

  interface CloudflareEnv {
    DB: D1Database;
    AURA_CACHE: KVNamespace;
    NEXT_INC_CACHE_KV: KVNamespace;
    ASSETS: Fetcher;
    WORKER_SELF_REFERENCE: Fetcher;
    NEXT_CACHE_DO_QUEUE?: DurableObjectNamespace;
    CLOUDFLARE_WORKERS?: string;
    SUBTITLES_MODE?: string;
    DRAMABOS_BASE_URL?: string;
    DRAMABOS_DEFAULT_PROVIDER?: string;
    DRAMABOS_LANG?: string;
    ADMIN_EMAIL?: string;
    HOME_CACHE_TTL_SEC?: string;
    AUTH_SECRET?: string;
    AUTH_URL?: string;
    DRAMABOS_API_KEY?: string;
    ADMIN_PASSWORD?: string;
    ADMIN_PASSWORD_HASH?: string;
    CRON_SECRET?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
  }
}

export {};
