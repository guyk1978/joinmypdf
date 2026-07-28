"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import type { ToolGridItem } from "@/lib/tool-grid";
import {
  TOOLS_DIRECTORY_BATCH_SIZE,
  TOOLS_DIRECTORY_INITIAL_VISIBLE,
} from "@/lib/tool-grid-config";

type ToolsDirectoryCategoryListProps = {
  id: string;
  title: string;
  items: ToolGridItem[];
  categoryId?: InventoryCategoryId;
  /** When true, render every tool (no "show more" truncation). */
  showAll?: boolean;
};

export function ToolsDirectoryCategoryList({
  id,
  title,
  items,
  categoryId,
  showAll = false,
}: ToolsDirectoryCategoryListProps) {
  const t = useTranslations("Home");
  const [visibleCount, setVisibleCount] = useState(
    showAll ? items.length : TOOLS_DIRECTORY_INITIAL_VISIBLE,
  );
  const effectiveVisible = showAll ? items.length : visibleCount;
  const visibleItems = items.slice(0, effectiveVisible);
  const remainingCount = showAll ? 0 : Math.max(0, items.length - visibleCount);

  return (
    <section className="tools-directory-category" aria-labelledby={title ? id : undefined}>
      {title ? (
        <h3 id={id} className="tools-directory-category__title">
          {title}
        </h3>
      ) : null}
      <CategoryDirectoryFlatGrid items={visibleItems} categoryId={categoryId} />
      {remainingCount > 0 ? (
        <button
          type="button"
          className="tools-directory-show-more"
          onClick={() =>
            setVisibleCount((current) => Math.min(current + TOOLS_DIRECTORY_BATCH_SIZE, items.length))
          }
        >
          {t("showMoreTools", { count: remainingCount })}
        </button>
      ) : null}
    </section>
  );
}
