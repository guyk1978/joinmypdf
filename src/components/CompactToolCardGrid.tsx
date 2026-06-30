import { clsx } from "clsx";
import { HomeFeaturedToolCard } from "@/components/HomeFeaturedCards";

export type CompactToolCardItem = {
  href: string;
  label: string;
  slugHint?: string;
};

export function CompactToolCardGrid({
  items,
  className,
}: {
  items: CompactToolCardItem[];
  className?: string;
  variant?: "default" | "glass";
}) {
  return (
    <div className={clsx("home-feature-grid", className)}>
      {items.map((item) => (
        <HomeFeaturedToolCard
          key={`${item.href}-${item.label}`}
          href={item.href}
          label={item.label}
          slugHint={item.slugHint ?? item.href}
        />
      ))}
    </div>
  );
}
