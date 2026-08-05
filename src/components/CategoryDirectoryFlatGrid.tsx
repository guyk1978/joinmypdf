"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";
import { MinimalToolCard } from "@/components/MinimalToolCard";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
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
 * Global ultra-minimal tool card grid — up to 4 columns on desktop.
 */
export function CategoryDirectoryFlatGrid({
  items,
  className,
  categoryId,
  lead,
  leadClassName,
}: CategoryDirectoryFlatGridProps) {
  return (
    <ul className={clsx("im-tool-card-grid", className)}>
      {lead ? (
        <li className={clsx("im-tool-card-grid__lead", leadClassName)}>{lead}</li>
      ) : null}
      {items.map((item) => (
        <li key={item.slugHint} className="im-tool-card-grid__item">
          <MinimalToolCard
            href={item.href}
            label={item.label}
            description={item.description}
            slug={item.slugHint}
            categoryId={categoryId}
          />
        </li>
      ))}
    </ul>
  );
}
