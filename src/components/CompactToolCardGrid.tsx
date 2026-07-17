import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { getToolCardDescription } from "@/data/tool-card-descriptions";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import type { ToolGridItem } from "@/lib/tool-grid";

export type CompactToolCardItem = {
  href: string;
  label: string;
  slugHint?: string;
};

type CompactToolCardGridProps = {
  items: CompactToolCardItem[];
  className?: string;
  /** Kept for call-site compatibility — all variants render Industrial Matte cards. */
  variant?: "default" | "glass" | "flat";
};

export function CompactToolCardGrid({ items, className }: CompactToolCardGridProps) {
  const gridItems: ToolGridItem[] = items.map((item) => {
    const slug = item.slugHint ?? item.href;
    return {
      href: item.href,
      label: item.label,
      slugHint: slug,
      description: getToolCardDescription(
        slug,
        getToolsInventoryEntry(slug)?.description,
      ),
    };
  });

  return <CategoryDirectoryFlatGrid items={gridItems} className={className} />;
}
