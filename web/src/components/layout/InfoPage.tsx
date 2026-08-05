import Link from "next/link";

export function InfoPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-8">
      <div className="flex items-center gap-1 border-b-2 border-[var(--color-divider)] px-2 py-1.5">
        <Link href="/" className="icon-btn" aria-label="Kembali">
          <i className="fa-solid fa-chevron-left text-lg" />
        </Link>
        <h1 className="truncate pr-3 text-[16px] font-extrabold">{title}</h1>
      </div>
      <article className="space-y-4 px-4 py-5 text-[14px] leading-relaxed text-[var(--color-text)]">
        {children}
      </article>
    </div>
  );
}
