import { clsx } from "clsx";
import type { ReactNode } from "react";
import { IndustrialToolCard } from "@/components/IndustrialToolCard";
import { ToolListIcon } from "@/components/ToolListIcon";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { normalizeHubPath } from "@/lib/tool-hierarchy";
import type { ToolGridItem } from "@/lib/tool-grid";

type CategoryDirectoryFlatGridProps = {
  items: ToolGridItem[];
  className?: string;
  /** Page-level accent — wins over per-tool inventory so hub pages share one glow. */
  categoryId?: InventoryCategoryId;
  /** Optional lead cell (section header card) rendered first in the grid. */
  lead?: ReactNode;
  /** Extra class on the lead `<li>` (e.g. home-im-grid__lead--2x2). */
  leadClassName?: string;
};

/**
 * Global Industrial Matte tool card grid — 5-column dashboard used by every hub.
 */
export function CategoryDirectoryFlatGrid({
  items,
  className,
  categoryId,
  lead,
  leadClassName,
}: CategoryDirectoryFlatGridProps) {
  const returnHref = categoryId ? normalizeHubPath(categoryId) : undefined;

  return (
    <ul className={clsx("im-tool-card-grid", className)}>
      {lead ? (
        <li className={clsx("im-tool-card-grid__lead", leadClassName)}>{lead}</li>
      ) : null}
      {items.map((item) => (
        <li key={item.slugHint} className="im-tool-card-grid__item">
          <IndustrialToolCard
            href={item.href}
            label={item.label}
            description={item.description}
            slug={item.slugHint}
            categoryId={categoryId}
            returnHref={returnHref}
            icon={<ToolListIcon slug={item.slugHint} label={item.label} />}
          />
        </li>
      ))}
    </ul>
  );
}
