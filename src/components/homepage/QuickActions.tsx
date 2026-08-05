"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import { MinimalToolCard } from "@/components/MinimalToolCard";
import { HomeBatchActionsBar } from "@/components/homepage/HomeBatchActionsBar";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { HomeStaticPanel } from "@/components/homepage/HomeStaticPanel";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { useUnpinnedIds } from "@/hooks/usePinnedTools";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";

/**
 * Curated Quick Actions — fixed 4×4 static grid (16 tools).
 */
const QUICK_ACTION_TOOL_IDS = [
  "pdf-merge",
  "pdf-split",
  "jpg-to-pdf",
  "pdf-to-word",
  "pdf-compress",
  "video-trimmer",
  "pdf-to-excel",
  "pdf-a-converter",
  "word-to-pdf",
  "html-to-pdf",
  "base64-encoder-decoder",
  "case-converter",
  "color-palette-extractor",
  "batch-rename-pdf",
  "compare-pdf",
  "protect-pdf",
] as const;

const QUICK_ACTIONS_GRID_SIZE = 16;

type QuickActionsProps = {
  locale: string;
};

export function QuickActions({ locale }: QuickActionsProps) {
  const t = useTranslations("Home");
  const tTools = useTranslations("Tools");
  const visibleToolIds = useUnpinnedIds([...QUICK_ACTION_TOOL_IDS]);

  const cards = useMemo(() => {
    const resolved = [];
    for (const id of visibleToolIds) {
      const entry = getToolsInventoryEntry(id);
      if (!entry) continue;
      resolved.push({
        id,
        href: resolveToolHref(id, entry.primaryCategory, locale),
        title: resolveInventoryToolLabel(id, tTools),
        categoryId: entry.primaryCategory,
      });
      if (resolved.length >= QUICK_ACTIONS_GRID_SIZE) break;
    }
    return resolved;
  }, [visibleToolIds, locale, tTools]);

  if (!cards.length) return null;

  return (
    <HomeReveal className="w-full">
      <HomeStaticPanel
        id="quick-actions-title"
        className="home-quick-actions"
        title={t("landing.quickActionsTitle")}
        icon={<Zap size={16} strokeWidth={2.25} aria-hidden />}
        toolbar={<HomeBatchActionsBar scopeIds={QUICK_ACTION_TOOL_IDS} />}
        bodyClassName="im-tool-card-grid"
      >
        {cards.map(({ id, href, title, categoryId }) => (
          <MinimalToolCard
            key={id}
            href={href}
            label={title}
            slug={id}
            categoryId={categoryId}
          />
        ))}
      </HomeStaticPanel>
    </HomeReveal>
  );
}
