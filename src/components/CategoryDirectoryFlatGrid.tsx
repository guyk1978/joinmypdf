import "@/styles/tools-grid.css";
import { HomeFlatToolLink } from "@/components/HomeFlatToolLink";
import type { ToolGridItem } from "@/lib/tool-grid";

type CategoryDirectoryFlatGridProps = {
  items: ToolGridItem[];
};

export function CategoryDirectoryFlatGrid({ items }: CategoryDirectoryFlatGridProps) {
  return (
    <ul className="tools-grid">
      {items.map((item) => (
        <li key={item.slugHint}>
          <HomeFlatToolLink href={item.href} label={item.label} slugHint={item.slugHint} />
        </li>
      ))}
    </ul>
  );
}
