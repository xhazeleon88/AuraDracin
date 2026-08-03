"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const hide =
    pathname.startsWith("/video/") ||
    pathname.startsWith("/drama/") ||
    pathname.startsWith("/admin");

  if (hide) return null;

  const items = [
    { href: "/", label: "Beranda", icon: "fa-house", match: (p: string) => p === "/" },
    {
      href: "/kategori/romance",
      label: "Kategori",
      icon: "fa-grip",
      match: (p: string) => p.startsWith("/kategori"),
    },
    {
      href: "/profil",
      label: "Profil",
      icon: "fa-user",
      match: (p: string) => p.startsWith("/profil") || p.startsWith("/masuk"),
    },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={item.match(pathname) ? "active" : ""}
        >
          <i className={`fa-solid ${item.icon} text-[18px]`} />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
