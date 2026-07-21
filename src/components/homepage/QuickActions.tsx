"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import { IndustrialToolCard } from "@/components/IndustrialToolCard";
import { ToolListIcon } from "@/components/ToolListIcon";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { HomeSection } from "@/components/homepage/HomeSection";
import { HOME_SECTION_MAX_ITEMS } from "@/components/homepage/home-section";
import { readTopUsedToolIds } from "@/lib/recent-activity";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { getToolCardDescription } from "@/data/tool-card-descriptions";
import { useUnpinnedIds } from "@/hooks/usePinnedTools";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";

/** Shown until the visitor has personal usage history (up to 20). */
const FALLBACK_QUICK_ACTION_IDS = [
  "pdf-merge",
  "pdf-compress",
  "image-combiner",
  "video-trimmer",
  "jpg-to-pdf",
  "word-to-pdf",
  "unit-converter",
  "compress-image",
  "qr-code-generator",
  "case-converter",
  "pdf-split",
  "pdf-to-jpg",
  "video-to-mp3",
  "text-workspace",
  "excel-to-pdf",
  "rotate-pdf",
  "unlock-pdf",
  "protect-pdf",
  "hash-generator",
  "password-generator",
] as const;

type QuickActionsProps = {
  locale: string;
};

/**
 * Top homepage utility section — category-style tool cards in a carousel
 * (personal top tools when available, otherwise curated fallbacks).
 */
export function QuickActions({ locale }: QuickActionsProps) {
  const t = useTranslations("Home");
  const tTools = useTranslations("Tools");
  const [toolIds, setToolIds] = useState<string[]>([...FALLBACK_QUICK_ACTION_IDS]);

  useEffect(() => {
    const personal = readTopUsedToolIds(HOME_SECTION_MAX_ITEMS * 2).filter((id) =>
      getToolsInventoryEntry(id),
    );
    if (!personal.length) return;
    const merged = [...personal];
    for (const id of FALLBACK_QUICK_ACTION_IDS) {
      if (merged.length >= HOME_SECTION_MAX_ITEMS) break;
      if (!merged.includes(id)) merged.push(id);
    }
    setToolIds(merged.slice(0, HOME_SECTION_MAX_ITEMS));
  }, []);

  const visibleToolIds = useUnpinnedIds(toolIds);

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
        id="quick-actions-title"
        title={t("landing.quickActionsTitle")}
        icon={<Zap size={22} strokeWidth={1.75} />}
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
