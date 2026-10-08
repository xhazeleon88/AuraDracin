"use client";

import { EngagementRail } from "@/components/video/Engagement";
import { HlsPlayer } from "@/components/video/HlsPlayer";
import { WatchInfoSheet } from "@/components/video/WatchInfoSheet";
import Link from "next/link";

/** Local-only fixture to validate progressive MP4 + mobile chrome.
 *  NetShort CDN URLs truncate from this Cloud Agent network (~4MB), so we
 *  use a self-contained sample here. Production plays CDN MP4 direct. */
const SAMPLE_MP4 = "/fixtures/mobile-sample.mp4";
const COVER = "/assets/aura-dracin-mark.jpg";

export default function DevPlayerPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="p-6 text-sm">
        Dev player tidak tersedia di production.{" "}
        <Link href="/">Kembali</Link>
      </div>
    );
  }

  return (
    <div className="watch-page flex min-h-0 flex-1 flex-col overflow-hidden bg-black text-white">
      <div className="relative min-h-0 flex-1 bg-black">
        <div className="absolute inset-0 mx-auto h-full w-full max-w-[480px]">
          <HlsPlayer key="mobile-sample" src={SAMPLE_MP4} poster={COVER} type="mp4" />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start gap-2 px-2 pt-[max(8px,env(safe-area-inset-top))]"
            style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)",
              paddingBottom: 36,
            }}
          >
            <Link
              href="/"
              className="pointer-events-auto mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
              aria-label="Kembali"
            >
              <i className="fa-solid fa-chevron-left text-lg" />
            </Link>
          </div>
          <EngagementRail
            targetType="dramabos"
            targetId="netshort:dev-fixture"
            initialLikes={40900}
            initialComments={0}
          />
          <WatchInfoSheet
            provider="netshort"
            dramaId="dev-fixture"
            title="NetShort playback fixture"
            category="Romance"
            synopsis="Fixture lokal untuk memastikan MP4 NetShort dan chrome mobile seamless."
            hashtags={["dev"]}
            views={120000}
            likes={40900}
            episode={1}
            episodeCount={80}
            episodes={[
              { id: "1", number: 1 },
              { id: "2", number: 2 },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
