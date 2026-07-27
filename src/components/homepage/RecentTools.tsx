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
import { useUnpinnedIds } from "@/hooks/usePinnedTools";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";

const RECENT_GRID_SIZE = 4;

type RecentToolsProps = {
  locale: string;
};

/**
 * "Your Recent Tools" — compact static 2×2 grid (or empty state).
 */
export function RecentTools({ locale }: RecentToolsProps) {
  const t = useTranslations("Home");
  const tTools = useTranslations("Tools");
  const { recentToolIds, hydrated } = useRecentTools(RECENT_GRID_SIZE * 2);
  const visibleToolIds = useUnpinnedIds(recentToolIds);

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
      if (resolved.length >= RECENT_GRID_SIZE) break;
    }
    return resolved;
  }, [visibleToolIds, locale, tTools]);

  if (!hydrated) {
    return (
      <HomeReveal className="w-full h-full">
        <HomeStaticPanel
          id="recent-tools-title"
          title={t("landing.recentToolsTitle")}
          icon={<History size={22} strokeWidth={1.75} />}
          bodyClassName="home-tool-grid home-tool-grid--2x2 home-tool-grid--skeleton"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="home-tool-grid__placeholder" aria-hidden />
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
        bodyClassName={
          cards.length
            ? "home-tool-grid home-tool-grid--2x2"
            : "home-recent-empty"
        }
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
              icon={<ToolListIcon slug={id} label={title} size="md" />}
              className="home-tool-grid__card"
            />
          ))
        ) : (
          <p className="home-recent-empty__copy">{t("landing.recentToolsEmpty")}</p>
        )}
      </HomeStaticPanel>
    </HomeReveal>
  );
}
