"use client";

import { ToolGridCard } from "@/components/ToolGridCard";
import type { ToolGridItem } from "@/lib/tool-grid";

type ToolsDirectoryToolGridProps = {
  items: ToolGridItem[];
};

export function ToolsDirectoryToolGrid({ items }: ToolsDirectoryToolGridProps) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-8">
      {items.map((item) => (
        <ToolGridCard key={item.href} item={item} />
      ))}
    </div>
  );
}
