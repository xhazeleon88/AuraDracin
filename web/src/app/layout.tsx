import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { Providers } from "@/components/providers";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-archivo",
});

const SITE_URL = (() => {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    "";
  const cleaned = raw.replace(/\/$/, "");
  if (cleaned && !/localhost|127\.0\.0\.1/i.test(cleaned)) return cleaned;
  // Workers / production deploy — never emit localhost OG URLs.
  if (process.env.CLOUDFLARE_WORKERS === "1" || process.env.NEXTJS_ENV === "production") {
    return "https://aura-dracin.seo1-c33.workers.dev";
  }
  return cleaned || "https://aura-dracin.seo1-c33.workers.dev";
})();

const SITE_TITLE = "AuraDracin - Drama Singkat Baper Melekat";
const SITE_DESCRIPTION =
  "Nonton dracin favoritmu dengan cerita singkat, romantis, dan penuh emosi hanya di AuraDracin. Sekali play, susah berhenti.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | AuraDracin",
  },
  description: SITE_DESCRIPTION,
  applicationName: "AuraDracin",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AuraDracin",
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#ec3013",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "AuraDracin",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AuraDracin - Drama Singkat Baper Melekat",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link
          rel="preload"
          as="style"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <link
          id="fa-css"
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          media="print"
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){var l=document.getElementById("fa-css");if(!l)return;l.addEventListener("load",function(){l.media="all"});l.media="all"})();',
          }}
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          />
        </noscript>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/favicon-32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${archivo.variable} antialiased`} style={{ fontFamily: "var(--font-archivo), Archivo, system-ui, sans-serif" }}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
