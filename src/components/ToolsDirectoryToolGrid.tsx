"use client";

import { ToolGridCard } from "@/components/ToolGridCard";
import type { ToolGridItem } from "@/lib/tool-grid";

type ToolsDirectoryToolGridProps = {
  items: ToolGridItem[];
};

export function ToolsDirectoryToolGrid({ items }: ToolsDirectoryToolGridProps) {
  return (
    <div className="home-tool-grid">
      {items.map((item) => (
        <ToolGridCard key={item.href} item={item} />
      ))}
    </div>
  );
}
