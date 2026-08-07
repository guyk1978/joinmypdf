"use client";

import { clsx } from "clsx";
import type { ReactNode } from "react";
import { CategoryMarketingToolCard } from "@/components/CategoryMarketingToolCard";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import type { ToolGridItem } from "@/lib/tool-grid";
import "@/styles/category-hub-marketing.css";

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
 * Premium category tool grid — sleek marketing cards (rounded, icon + blurb + launch cue).
 */
export function CategoryDirectoryFlatGrid({
  items,
  className,
  categoryId,
  lead,
  leadClassName,
}: CategoryDirectoryFlatGridProps) {
  return (
    <ul className={clsx("chm-tool-grid", className)} role="list">
      {lead ? (
        <li className={clsx("chm-tool-grid__lead", leadClassName)}>{lead}</li>
      ) : null}
      {items.map((item) => (
        <li key={item.slugHint} className="chm-tool-grid__item">
          <CategoryMarketingToolCard
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
