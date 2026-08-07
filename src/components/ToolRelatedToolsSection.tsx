"use client";

import { useId, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MinimalToolCard } from "@/components/MinimalToolCard";
import { useToolPageShell } from "@/context/ToolPageShellContext";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getRelatedInventoryToolIds } from "@/lib/tools-inventory-query";
import { getToolCardShortLabel } from "@/lib/tool-labels";
import { registry } from "@/lib/registry";
import { getAudioToolById } from "@/lib/audio-tools";

type ToolRelatedToolsSectionProps = {
  slug?: string;
  /** Extra related slugs from SEO registry (`relatedTools`). */
  relatedSlugs?: string[];
  className?: string;
  limit?: number;
};

/**
 * Compact related-tools grid for tool landing pages — sits under Overview.
 */
export function ToolRelatedToolsSection({
  slug: slugProp,
  relatedSlugs = [],
  className,
  limit = 8,
}: ToolRelatedToolsSectionProps) {
  const locale = useLocale();
  const shell = useToolPageShell();
  const tPage = useTranslations("ToolPage");
  const tTools = useTranslations("Tools");
  const headingId = useId();
  const toolSlug = slugProp || shell.slug;

  const items = useMemo(() => {
    if (!toolSlug) return [];

    const capped = Math.min(8, Math.max(1, limit));
    const fromInventory = getRelatedInventoryToolIds(toolSlug, { limit: capped });
    const ordered: string[] = [];
    for (const id of [...relatedSlugs, ...fromInventory]) {
      if (id !== toolSlug && !ordered.includes(id)) ordered.push(id);
    }

    return ordered
      .map((id) => {
        const inv = getToolsInventoryEntry(id);
        const reg = registry.tools.find((entry) => entry.slug === id);
        const audio = getAudioToolById(id);
        const fallbackTitle = inv?.title ?? reg?.title ?? audio?.name;
        if (!fallbackTitle) return null;
        const localized = tTools.has(`items.${id}`)
          ? tTools(`items.${id}`)
          : fallbackTitle;
        return {
          slug: id,
          label: getToolCardShortLabel(id, localized),
          href: resolveToolHref(id, inv?.primaryCategory, locale),
          categoryId: inv?.primaryCategory,
        };
      })
      .filter(
        (
          entry,
        ): entry is {
          slug: string;
          label: string;
          href: string;
          categoryId: NonNullable<typeof entry>["categoryId"];
        } => Boolean(entry),
      )
      .slice(0, 8);
  }, [toolSlug, relatedSlugs, locale, limit, tTools]);

  if (!toolSlug || items.length < 1) return null;

  const heading = tPage.has("youMightAlsoNeed")
    ? tPage("youMightAlsoNeed")
    : tPage.has("relatedTools")
      ? tPage("relatedTools")
      : "You Might Also Need";

  return (
    <div
      className={["tool-related-tools", className].filter(Boolean).join(" ")}
      aria-labelledby={headingId}
      data-tool-related="1"
    >
      <h2 id={headingId} className="tool-related-tools__title">
        {heading}
      </h2>
      <ul className="tool-related-tools__grid im-tool-card-grid" role="list">
        {items.map((item) => (
          <li key={item.slug} className="tool-related-tools__item im-tool-card-grid__item">
            <MinimalToolCard
              href={item.href}
              label={item.label}
              slug={item.slug}
              categoryId={item.categoryId}
              interaction="expand"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
