import { IndustrialToolCard } from "@/components/IndustrialToolCard";
import { ToolListIcon } from "@/components/ToolListIcon";
import { clsx } from "clsx";
import type { ToolGridItem } from "@/lib/tool-grid";

type CategoryDirectoryFlatGridProps = {
  items: ToolGridItem[];
  className?: string;
};

/**
 * Global Industrial Matte tool card grid — used by every tools hub / category directory.
 */
export function CategoryDirectoryFlatGrid({ items, className }: CategoryDirectoryFlatGridProps) {
  return (
    <ul className={clsx("im-tool-card-grid", className)}>
      {items.map((item) => (
        <li key={item.slugHint} className="im-tool-card-grid__item">
          <IndustrialToolCard
            href={item.href}
            label={item.label}
            description={item.description}
            slug={item.slugHint}
            icon={<ToolListIcon slug={item.slugHint} label={item.label} />}
          />
        </li>
      ))}
    </ul>
  );
}
