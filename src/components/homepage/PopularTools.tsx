"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Flame } from "lucide-react";
import { IndustrialToolCard } from "@/components/IndustrialToolCard";
import { ToolListIcon } from "@/components/ToolListIcon";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { HomeSection } from "@/components/homepage/HomeSection";
import { HOME_SECTION_MAX_ITEMS } from "@/components/homepage/home-section";
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
  "qr-code-generator",
  "case-converter",
  "video-trimmer",
  "compress-image",
  "unit-converter",
  "pdf-to-jpg",
  "excel-to-pdf",
  "rotate-pdf",
  "protect-pdf",
  "unlock-pdf",
  "hash-generator",
  "password-generator",
] as const;

type PopularToolsProps = {
  locale: string;
};

/**
 * "Popular Tools of the Week" — up to 20 category-style cards.
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
      if (resolved.length >= HOME_SECTION_MAX_ITEMS) break;
    }
    return resolved;
  }, [visibleToolIds, locale, tTools]);

  if (!cards.length) return null;

  return (
    <HomeReveal className="w-full">
      <HomeSection
        id="popular-tools-title"
        title={t("landing.popularToolsTitle")}
        icon={<Flame size={22} strokeWidth={1.75} />}
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
          />
        ))}
      </HomeSection>
    </HomeReveal>
  );
}
