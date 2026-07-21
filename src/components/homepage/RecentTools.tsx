"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { History } from "lucide-react";
import { IndustrialToolCard } from "@/components/IndustrialToolCard";
import { ToolListIcon } from "@/components/ToolListIcon";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { HomeSection } from "@/components/homepage/HomeSection";
import { HOME_SECTION_MAX_ITEMS } from "@/components/homepage/home-section";
import { useRecentTools } from "@/hooks/useRecentTools";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { getToolCardDescription } from "@/data/tool-card-descriptions";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";

type RecentToolsProps = {
  locale: string;
};

/**
 * "Your Recent Tools" — up to 20 recent tools as category-style cards.
 */
export function RecentTools({ locale }: RecentToolsProps) {
  const t = useTranslations("Home");
  const tTools = useTranslations("Tools");
  const { recentToolIds, hydrated } = useRecentTools(HOME_SECTION_MAX_ITEMS);

  const cards = useMemo(() => {
    const resolved = [];
    for (const id of recentToolIds) {
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
  }, [recentToolIds, locale, tTools]);

  if (!hydrated || !cards.length) return null;

  return (
    <HomeReveal className="w-full">
      <HomeSection
        id="recent-tools-title"
        title={t("landing.recentToolsTitle")}
        icon={<History size={22} strokeWidth={1.75} />}
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
