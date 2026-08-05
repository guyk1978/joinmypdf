"use client";

import { usePathname } from "@/i18n/navigation";
import { MinimalToolCard } from "@/components/MinimalToolCard";
import type { ToolGridItem } from "@/lib/tool-grid";

type ToolGridCardAccordionProps = {
  isSelected: boolean;
  onToggle: () => void;
  panelId: string;
};

type ToolGridCardProps = {
  item: ToolGridItem;
  /** Force favorites view (remove icon). Defaults to route detection. */
  favoritesView?: boolean;
  accordion?: ToolGridCardAccordionProps;
};

/**
 * Favorites / library grid card — delegates to the global MinimalToolCard.
 */
export function ToolGridCard({ item, favoritesView, accordion }: ToolGridCardProps) {
  const pathname = usePathname() || "/";
  const slug = item.slugHint;
  const showRemove = favoritesView ?? pathname.includes("/favorites");

  return (
    <MinimalToolCard
      href={item.href}
      label={item.label}
      description={item.description}
      slug={slug}
      favoritesRemove={showRemove}
      className={accordion?.isSelected ? "im-tool-card--selected" : undefined}
    />
  );
}
