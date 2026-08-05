import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.dramabuzz.sbs" },
      { protocol: "https", hostname: "**.goodbos.online" },
      { protocol: "https", hostname: "**.goodreels.com" },
      { protocol: "https", hostname: "**.crazymaplestudios.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
