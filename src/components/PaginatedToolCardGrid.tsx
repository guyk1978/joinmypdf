"use client";

import { Children, useMemo, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { ToolCardGrid } from "@/components/ToolCardGrid";
import { ToolGridShowMoreButton } from "@/components/ToolGridShowMoreButton";
import {
  TOOL_GRID_BATCH_SIZE,
  TOOL_GRID_INITIAL_VISIBLE,
} from "@/lib/tool-grid-config";

type PaginatedToolCardGridProps = {
  children: ReactNode;
  className?: string;
  initialVisible?: number;
  batchSize?: number;
};

export function PaginatedToolCardGrid({
  children,
  className,
  initialVisible = TOOL_GRID_INITIAL_VISIBLE,
  batchSize = TOOL_GRID_BATCH_SIZE,
}: PaginatedToolCardGridProps) {
  const items = useMemo(() => Children.toArray(children), [children]);
  const [visibleCount, setVisibleCount] = useState(initialVisible);

  const visibleItems = items.slice(0, visibleCount);
  const remainingCount = Math.max(0, items.length - visibleCount);

  const showMore = () => {
    setVisibleCount((current) => Math.min(current + batchSize, items.length));
  };

  return (
    <>
      <ToolCardGrid className={clsx("tool-card-grid--stretch", className)}>
        {visibleItems}
      </ToolCardGrid>
      {remainingCount > 0 ? (
        <ToolGridShowMoreButton remainingCount={remainingCount} onClick={showMore} />
      ) : null}
    </>
  );
}
