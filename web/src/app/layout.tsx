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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <link rel="icon" href="/assets/aura-dracin-mark.jpg" />
      </head>
      <body className={`${archivo.variable} antialiased`} style={{ fontFamily: "var(--font-archivo), Archivo, system-ui, sans-serif" }}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
