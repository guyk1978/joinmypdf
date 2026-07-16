"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import type { ToolGridItem } from "@/lib/tool-grid";
import {
  TOOLS_DIRECTORY_BATCH_SIZE,
  TOOLS_DIRECTORY_INITIAL_VISIBLE,
} from "@/lib/tool-grid-config";

type ToolsDirectoryCategoryListProps = {
  id: string;
  title: string;
  items: ToolGridItem[];
};

export function ToolsDirectoryCategoryList({ id, title, items }: ToolsDirectoryCategoryListProps) {
  const t = useTranslations("Home");
  const [visibleCount, setVisibleCount] = useState(TOOLS_DIRECTORY_INITIAL_VISIBLE);
  const visibleItems = items.slice(0, visibleCount);
  const remainingCount = Math.max(0, items.length - visibleCount);

  return (
    <section className="tools-directory-category" aria-labelledby={title ? id : undefined}>
      {title ? (
        <h3 id={id} className="tools-directory-category__title">
          {title}
        </h3>
      ) : null}
      <CategoryDirectoryFlatGrid items={visibleItems} />
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
