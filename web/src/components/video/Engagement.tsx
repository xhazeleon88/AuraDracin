"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { fmtNum } from "@/lib/constants";

export function EngagementRail({
  targetType,
  targetId,
  initialLikes,
  initialComments,
  liked: initialLiked,
}: {
  targetType: "local" | "dramabos";
  targetId: string;
  initialLikes: number;
  initialComments: number;
  liked?: boolean;
}) {
  const { data } = useSession();
  const router = useRouter();
  const [liked, setLiked] = useState(Boolean(initialLiked));
  const [likes, setLikes] = useState(initialLikes);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<
    { id: string; body: string; name: string; createdAt: string }[]
  >([]);
  const [text, setText] = useState("");
  const [commentCount, setCommentCount] = useState(initialComments);

  async function toggleLike() {
    if (!data?.user) {
      router.push("/masuk");
      return;
    }
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId }),
    });
    const json = await res.json();
    if (res.ok) {
      setLiked(json.liked);
      setLikes((n) => n + (json.liked ? 1 : -1));
    }
  }

  async function loadComments() {
    const res = await fetch(
      `/api/comments?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`,
    );
    const json = await res.json();
    setComments(json.comments || []);
    setCommentCount((json.comments || []).length);
    setOpen(true);
  }

  async function submitComment() {
    if (!data?.user) {
      router.push("/masuk");
      return;
    }
    if (!text.trim()) return;
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, body: text.trim() }),
    });
    if (res.ok) {
      setText("");
      await loadComments();
    }
  }

  return (
    <>
      {/* Right rail — stacked above caption / scrubber, TikTok spacing */}
      <div className="pointer-events-none absolute bottom-[100px] right-1.5 z-30 flex items-end justify-end sm:right-2.5">
        <div className="pointer-events-auto flex flex-col items-center gap-3.5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
          <button type="button" className="flex flex-col items-center gap-0.5" onClick={toggleLike}>
            <span className="flex h-12 w-12 items-center justify-center">
              <i
                className="fa-solid fa-heart text-[28px]"
                style={{ color: liked ? "var(--color-accent)" : "white" }}
              />
            </span>
            <span className="text-[11px] font-bold">{fmtNum(likes)}</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-0.5" onClick={loadComments}>
            <span className="flex h-12 w-12 items-center justify-center">
              <i className="fa-solid fa-comment-dots text-[26px]" />
            </span>
            <span className="text-[11px] font-bold">{fmtNum(commentCount)}</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-0.5"
            onClick={async () => {
              if (navigator.share) {
                await navigator.share({ url: window.location.href, title: document.title });
              } else {
                await navigator.clipboard.writeText(window.location.href);
              }
            }}
          >
            <span className="flex h-12 w-12 items-center justify-center">
              <i className="fa-solid fa-share text-[24px]" />
            </span>
            <span className="text-[11px] font-bold">Bagikan</span>
          </button>
        </div>
      </div>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/55"
            onClick={() => setOpen(false)}
          />
          <div className="fixed bottom-0 left-1/2 z-50 flex h-[70vh] w-full max-w-[480px] -translate-x-1/2 flex-col border-t-2 border-[var(--color-divider)] bg-[var(--color-bg)] text-[var(--color-text)]">
            <div className="flex items-center border-b-2 border-[var(--color-divider)] px-4 py-3.5">
              <h4 className="text-base">Komentar</h4>
              <button
                type="button"
                className="icon-btn ml-auto"
                onClick={() => setOpen(false)}
                aria-label="Tutup"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3.5">
              {comments.length === 0 ? (
                <p className="text-muted text-sm">Belum ada komentar. Jadi yang pertama yuk.</p>
              ) : (
                comments.map((cm) => (
                  <div key={cm.id} className="flex gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-neutral-400)] text-xs font-extrabold">
                      {cm.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-bold">{cm.name}</span>
                        <span className="text-muted text-[11px]">{cm.createdAt}</span>
                      </div>
                      <p className="m-0 text-[13px]">{cm.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {data?.user ? (
              <div className="flex gap-2 border-t-2 border-[var(--color-divider)] px-4 py-3">
                <input
                  className="input"
                  placeholder="Komen scene favoritmu!"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button type="button" className="btn btn-primary" onClick={submitComment}>
                  <i className="fa-solid fa-paper-plane" />
                  Kirim
                </button>
              </div>
            ) : (
              <div className="border-t-2 border-[var(--color-divider)] px-4 py-3.5">
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => router.push("/masuk")}
                >
                  <i className="fa-solid fa-comment" />
                  Masuk dulu buat kasih komen
                </button>
              </div>
            )}
          </div>
        </>
      ) : null}
    </>
  );
}
