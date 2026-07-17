import { clsx } from "clsx";
import type { ReactNode } from "react";
import { IndustrialToolCard } from "@/components/IndustrialToolCard";
import { ToolListIcon } from "@/components/ToolListIcon";
import type { ToolGridItem } from "@/lib/tool-grid";

type CategoryDirectoryFlatGridProps = {
  items: ToolGridItem[];
  className?: string;
  /** Optional lead cell (section header card) rendered first in the grid. */
  lead?: ReactNode;
  /** Extra class on the lead `<li>` (e.g. home-im-grid__lead--2x2). */
  leadClassName?: string;
};

/**
 * Global Industrial Matte tool card grid — used by every tools hub / category directory.
 */
export function CategoryDirectoryFlatGrid({
  items,
  className,
  lead,
  leadClassName,
}: CategoryDirectoryFlatGridProps) {
  return (
    <ul className={clsx("im-tool-card-grid", className)}>
      {lead ? (
        <li className={clsx("im-tool-card-grid__lead", leadClassName)}>{lead}</li>
      ) : null}
      {items.map((item) => (
        <li key={item.slugHint} className="im-tool-card-grid__item">
          <IndustrialToolCard
            href={item.href}
            label={item.label}
            description={item.description}
            slug={item.slugHint}
            icon={<ToolListIcon slug={item.slugHint} label={item.label} />}
          />
        </li>
      ))}
    </ul>
  );
}
