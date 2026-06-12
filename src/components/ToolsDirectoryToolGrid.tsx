"use client";

import { clsx } from "clsx";
import { ToolGridCard } from "@/components/ToolGridCard";
import type { ToolGridItem } from "@/lib/tool-grid";

type ToolsDirectoryToolGridProps = {
  items: ToolGridItem[];
  className?: string;
};

export function ToolsDirectoryToolGrid({ items, className }: ToolsDirectoryToolGridProps) {
  return (
    <div className={clsx("home-tool-grid home-tool-grid--homepage", className)}>
      {items.map((item) => (
        <ToolGridCard key={item.href} item={item} />
      ))}
    </div>
  );
}
