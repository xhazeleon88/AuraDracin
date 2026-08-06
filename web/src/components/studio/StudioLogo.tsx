"use client";

import { useState } from "react";

/** Local studio mark with initials fallback if the asset is missing. */
export function StudioLogo({
  src,
  name,
  accent,
  className = "h-10 w-10 object-contain",
}: {
  src: string;
  name: string;
  accent?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "?";

  if (failed) {
    return (
      <span
        className="flex h-full w-full items-center justify-center text-[13px] font-extrabold tracking-tight text-white"
        style={{ background: accent || "#E11D48" }}
        aria-hidden
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
