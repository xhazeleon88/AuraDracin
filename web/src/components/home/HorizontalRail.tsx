import { VideoCard } from "@/components/video/VideoCard";
import type { DramaCard } from "@/lib/types";

export function HorizontalRail({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: DramaCard[];
}) {
  if (!items.length) return null;

  return (
    <section className="border-t-2 border-[var(--color-divider)] py-5">
      <div className="px-4 pb-1">
        <h3 className="text-[19px]">{title}</h3>
        {subtitle ? <p className="text-muted m-0 text-xs">{subtitle}</p> : null}
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pt-3.5">
        {items.map((item) => (
          <VideoCard key={`${item.source}-${item.provider}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  );
}
