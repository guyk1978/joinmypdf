"use client";

import { useMemo } from "react";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import { IndustrialToolCard } from "@/components/IndustrialToolCard";
import { filterUnpinnedGridItems, usePinnedTools } from "@/hooks/usePinnedTools";
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
 * Global Industrial Matte tool card grid — 4-column dashboard used by every hub
 * (collapses to 3 / 2 / 1 columns on smaller screens).
 */
export function CategoryDirectoryFlatGrid({
  items,
  className,
  categoryId,
  lead,
  leadClassName,
}: CategoryDirectoryFlatGridProps) {
  const returnHref = categoryId ? normalizeHubPath(categoryId) : undefined;
  const { pinnedIds, hydrated } = usePinnedTools();
  const visibleItems = useMemo(() => {
    if (!hydrated) return items;
    return filterUnpinnedGridItems(items, pinnedIds);
  }, [items, pinnedIds, hydrated]);

  return (
    <ul className={clsx("im-tool-card-grid", className)}>
      {lead ? (
        <li className={clsx("im-tool-card-grid__lead", leadClassName)}>{lead}</li>
      ) : null}
      {visibleItems.map((item) => (
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
