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
      <div className="absolute bottom-4 right-3 z-10 flex flex-col items-center gap-5 text-white">
        <button type="button" className="flex flex-col items-center gap-1" onClick={toggleLike}>
          <i
            className="fa-solid fa-heart text-2xl"
            style={{ color: liked ? "var(--color-accent)" : "white" }}
          />
          <span className="text-[11px]">{fmtNum(likes)}</span>
        </button>
        <button type="button" className="flex flex-col items-center gap-1" onClick={loadComments}>
          <i className="fa-solid fa-comment text-[23px]" />
          <span className="text-[11px]">{fmtNum(commentCount)}</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center gap-1"
          onClick={async () => {
            if (navigator.share) {
              await navigator.share({ url: window.location.href, title: document.title });
            } else {
              await navigator.clipboard.writeText(window.location.href);
            }
          }}
        >
          <i className="fa-solid fa-share text-[21px]" />
          <span className="text-[11px]">Bagikan</span>
        </button>
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
