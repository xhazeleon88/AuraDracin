"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "aura-dracin-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const ios = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || ios;
}

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit;
}

export function InstallPrompt() {
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    // Show for new sessions even before BIP (esp. iOS), after a short beat.
    const t = window.setTimeout(() => {
      if (sessionStorage.getItem(SESSION_KEY) === "1" || isStandalone()) return;
      if (isIosSafari()) {
        setIosHint(true);
        setOpen(true);
      } else {
        setOpen(true);
      }
    }, 1200);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* ignore SW failures in preview tunnels */
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.clearTimeout(t);
    };
  }, []);

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(false);
  }

  async function install() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      dismiss();
      return;
    }
    if (isIosSafari()) {
      setIosHint(true);
      return;
    }
    dismiss();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div
        role="dialog"
        aria-labelledby="install-title"
        className="relative w-full max-w-[360px] border-2 border-[var(--color-divider)] bg-[var(--color-bg)] p-5 shadow-[0_12px_40px_rgba(32,30,29,0.28)]"
      >
        <button
          type="button"
          className="icon-btn absolute right-1 top-1 text-[var(--color-neutral-700)]"
          onClick={dismiss}
          aria-label="Tutup"
        >
          <i className="fa-solid fa-xmark text-lg" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <img
            src="/icons/icon-192.png"
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 object-cover"
          />
          <div>
            <h2 id="install-title" className="text-[18px] font-extrabold leading-tight">
              Install Aura Dracin di HP kamu
            </h2>
            <p className="mt-1.5 text-[13px] text-[var(--color-neutral-700)]">
              Biar nonton dracin tinggal buka dari home. Gak perlu cari-cari link lagi.
            </p>
          </div>
        </div>

        {iosHint ? (
          <p className="mt-4 border border-[var(--color-divider)] bg-[var(--color-surface)] px-3 py-2.5 text-[12px] text-[var(--color-neutral-800)]">
            Di iPhone: ketuk <strong>Share</strong>{" "}
            <i className="fa-solid fa-arrow-up-from-bracket" /> terus pilih{" "}
            <strong>Add to Home Screen</strong>.
          </p>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button type="button" className="btn btn-secondary flex-1" onClick={dismiss}>
            Skip dulu
          </button>
          <button type="button" className="btn btn-primary flex-1" onClick={install}>
            <i className="fa-solid fa-download" />
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
