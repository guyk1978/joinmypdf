import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import type { ToolGridItem } from "@/lib/tool-grid";

type PdfToolsCardGridProps = {
  items: ToolGridItem[];
  className?: string;
};

/** PDF hub grid — always themed with the PDF accent. */
export function PdfToolsCardGrid({ items, className }: PdfToolsCardGridProps) {
  return <CategoryDirectoryFlatGrid items={items} className={className} categoryId="pdf" />;
}
