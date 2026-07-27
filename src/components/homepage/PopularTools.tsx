"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Flame } from "lucide-react";
import { IndustrialToolCard } from "@/components/IndustrialToolCard";
import { ToolListIcon } from "@/components/ToolListIcon";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { HomeStaticPanel } from "@/components/homepage/HomeStaticPanel";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { getToolCardDescription } from "@/data/tool-card-descriptions";
import { useUnpinnedIds } from "@/hooks/usePinnedTools";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";

/** Featured tools this week — resolved from the inventory registry. */
const POPULAR_TOOL_IDS = [
  "image-combiner",
  "pdf-compress",
  "text-workspace",
  "pdf-merge",
  "pdf-split",
  "jpg-to-pdf",
  "word-to-pdf",
  "video-to-mp3",
] as const;

const POPULAR_GRID_SIZE = 4;

type PopularToolsProps = {
  locale: string;
};

/**
 * "Popular Tools of the Week" — static 2×2 Industrial Matte grid.
 */
export function PopularTools({ locale }: PopularToolsProps) {
  const t = useTranslations("Home");
  const tTools = useTranslations("Tools");
  const visibleToolIds = useUnpinnedIds([...POPULAR_TOOL_IDS]);

  const cards = useMemo(() => {
    const resolved = [];
    for (const id of visibleToolIds) {
      const entry = getToolsInventoryEntry(id);
      if (!entry) continue;
      resolved.push({
        id,
        href: resolveToolHref(id, entry.primaryCategory, locale),
        title: resolveInventoryToolLabel(id, tTools),
        description: getToolCardDescription(id, entry.description, tTools) ?? "",
        categoryId: entry.primaryCategory,
      });
      if (resolved.length >= POPULAR_GRID_SIZE) break;
    }
    return resolved;
  }, [visibleToolIds, locale, tTools]);

  if (!cards.length) return null;

  return (
    <HomeReveal className="w-full h-full">
      <HomeStaticPanel
        id="popular-tools-title"
        title={t("landing.popularToolsTitle")}
        icon={<Flame size={22} strokeWidth={1.75} />}
        bodyClassName="home-tool-grid home-tool-grid--2x2"
      >
        {cards.map(({ id, href, title, description, categoryId }) => (
          <IndustrialToolCard
            key={id}
            href={href}
            label={title}
            description={description}
            slug={id}
            categoryId={categoryId}
            icon={<ToolListIcon slug={id} label={title} size="md" />}
            className="home-tool-grid__card"
          />
        ))}
      </HomeStaticPanel>
    </HomeReveal>
  );
}
