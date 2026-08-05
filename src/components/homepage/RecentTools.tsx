"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { History } from "lucide-react";
import { IndustrialToolCard } from "@/components/IndustrialToolCard";
import { ToolListIcon } from "@/components/ToolListIcon";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { HomeStaticPanel } from "@/components/homepage/HomeStaticPanel";
import { useRecentTools } from "@/hooks/useRecentTools";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { getToolCardDescription } from "@/data/tool-card-descriptions";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";

const RECENT_GRID_SIZE = 12;

type RecentToolsProps = {
  locale: string;
};

/**
 * "Your Recent Tools" — compact 3-column grid, max 12 (or empty state).
 */
export function RecentTools({ locale }: RecentToolsProps) {
  const t = useTranslations("Home");
  const tTools = useTranslations("Tools");
  const { recentToolIds, hydrated } = useRecentTools(RECENT_GRID_SIZE * 3);

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
      if (resolved.length >= RECENT_GRID_SIZE) break;
    }
    return resolved;
  }, [recentToolIds, locale, tTools]);

  if (!hydrated) {
    return (
      <HomeReveal className="w-full h-full">
        <HomeStaticPanel
          id="recent-tools-title"
          title={t("landing.recentToolsTitle")}
          icon={<History size={22} strokeWidth={1.75} />}
          bodyClassName="im-tool-card-grid im-tool-card-grid--skeleton"
        >
          {Array.from({ length: RECENT_GRID_SIZE }, (_, index) => (
            <div key={index} className="im-tool-card-grid__placeholder" aria-hidden />
          ))}
        </HomeStaticPanel>
      </HomeReveal>
    );
  }

  return (
    <HomeReveal className="w-full h-full">
      <HomeStaticPanel
        id="recent-tools-title"
        title={t("landing.recentToolsTitle")}
        icon={<History size={22} strokeWidth={1.75} />}
        bodyClassName={cards.length ? "im-tool-card-grid" : "home-recent-empty"}
      >
        {cards.length ? (
          cards.map(({ id, href, title, description, categoryId }) => (
            <IndustrialToolCard
              key={id}
              href={href}
              label={title}
              description={description}
              slug={id}
              categoryId={categoryId}
              icon={<ToolListIcon slug={id} label={title} size="sm" />}
            />
          ))
        ) : (
          <p className="home-recent-empty__copy">{t("landing.recentToolsEmpty")}</p>
        )}
      </HomeStaticPanel>
    </HomeReveal>
  );
}
