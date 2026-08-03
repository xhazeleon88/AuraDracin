"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWatch = pathname.startsWith("/video/") || pathname.startsWith("/drama/");

  return (
    <div className="min-h-screen bg-[var(--color-neutral-400)]/30">
      <div className="phone-shell">
        {isWatch ? null : <AppHeader />}
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        {isWatch ? null : <BottomNav />}
      </div>
    </div>
  );
}
