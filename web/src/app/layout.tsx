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

export const metadata: Metadata = {
  title: {
    default: "Aura Dracin — Nonton Dracin, Rasain Auranya",
    template: "%s | Aura Dracin",
  },
  description:
    "Nonton Dracin (Drama Cina) portrait-first buat millennials & Gen Z. Lagi populer, terbaru, kategori, dan feed DramaBos.",
  applicationName: "Aura Dracin",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aura Dracin",
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: "#ec3013",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
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
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <link rel="icon" href="/icons/icon-192.png" />
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
