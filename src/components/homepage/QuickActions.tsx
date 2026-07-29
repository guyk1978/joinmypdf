"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import { IndustrialToolCard } from "@/components/IndustrialToolCard";
import { ToolListIcon } from "@/components/ToolListIcon";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { HomeStaticPanel } from "@/components/homepage/HomeStaticPanel";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { getToolCardDescription } from "@/data/tool-card-descriptions";
import { useUnpinnedIds } from "@/hooks/usePinnedTools";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";

/**
 * Curated Quick Actions — fixed 5×3 static grid (15 tools).
 * Order matches the homepage layout (row-major).
 */
const QUICK_ACTION_TOOL_IDS = [
  // Row 1
  "pdf-merge",
  "pdf-split",
  "jpg-to-pdf",
  // Row 2
  "pdf-to-word",
  "pdf-compress",
  "video-trimmer",
  // Row 3
  "pdf-to-excel",
  "pdf-a-converter",
  "word-to-pdf",
  // Row 4
  "html-to-pdf",
  "base64-encoder-decoder",
  "case-converter",
  // Row 5
  "color-palette-extractor",
  "batch-rename-pdf",
  "compare-pdf",
] as const;

const QUICK_ACTIONS_GRID_SIZE = 15;

type QuickActionsProps = {
  locale: string;
};

/**
 * Top homepage utility section — static 5×3 Industrial Matte tool card grid.
 */
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
        description: getToolCardDescription(id, entry.description, tTools) ?? "",
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
        bodyClassName="home-tool-grid home-tool-grid--2x2 home-quick-actions__grid"
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
