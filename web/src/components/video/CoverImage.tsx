"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Portrait cover with next/image (Workers Images when available).
 * Falls back to a gradient title block if the remote image fails.
 */
export function CoverImage({
  src,
  alt,
  priority = false,
  className = "object-cover",
}: {
  src?: string | null;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className="flex h-full w-full items-end bg-[linear-gradient(160deg,#1a1a1a_0%,#3a1515_55%,#7a1f1f_100%)] p-2.5"
        aria-hidden
      >
        <span className="line-clamp-4 text-[12px] font-bold leading-snug text-white/90">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 50vw, 180px"
      className={className}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
