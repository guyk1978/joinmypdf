"use client";

import { useLocale, useTranslations } from "next-intl";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { getToolCardDescription } from "@/data/tool-card-descriptions";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";
import { resolveToolHref } from "@/lib/tool-hierarchy";
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
  const locale = useLocale();
  const tTools = useTranslations("Tools");
  const gridItems: ToolGridItem[] = items.map((item) => {
    const slug = resolveCanonicalToolSlug(item.slugHint ?? item.href);
    const entry = getToolsInventoryEntry(slug);
    return {
      href: entry ? resolveToolHref(slug, entry.primaryCategory, locale) : item.href,
      label: item.label,
      slugHint: slug,
      description: getToolCardDescription(slug, entry?.description, tTools),
    };
  });

  return <CategoryDirectoryFlatGrid items={gridItems} className={className} />;
}
