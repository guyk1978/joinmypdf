"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Flame } from "lucide-react";
import { MinimalToolCard } from "@/components/MinimalToolCard";
import { HomeBatchActionsBar } from "@/components/homepage/HomeBatchActionsBar";
import { HomeReveal } from "@/components/homepage/HomeReveal";
import { HomeStaticPanel } from "@/components/homepage/HomeStaticPanel";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { resolveInventoryToolLabel } from "@/lib/tools-inventory-query";

const POPULAR_TOOL_IDS = [
  "image-combiner",
  "pdf-compress",
  "text-workspace",
  "pdf-merge",
  "pdf-split",
  "jpg-to-pdf",
  "word-to-pdf",
  "video-to-mp3",
  "pdf-to-png",
  "delete-pdf-pages",
  "extract-pdf-pages",
  "compress-image",
  "pdf-to-word",
  "png-to-pdf",
  "add-watermark",
  "excel-to-pdf",
] as const;

const POPULAR_GRID_SIZE = 16;

type PopularToolsProps = {
  locale: string;
};

export function PopularTools({ locale }: PopularToolsProps) {
  const t = useTranslations("Home");
  const tTools = useTranslations("Tools");

  const cards = useMemo(() => {
    const resolved = [];
    for (const id of POPULAR_TOOL_IDS) {
      const entry = getToolsInventoryEntry(id);
      if (!entry) continue;
      resolved.push({
        id,
        href: resolveToolHref(id, entry.primaryCategory, locale),
        title: resolveInventoryToolLabel(id, tTools),
        categoryId: entry.primaryCategory,
      });
      if (resolved.length >= POPULAR_GRID_SIZE) break;
    }
    return resolved;
  }, [locale, tTools]);

  if (!cards.length) return null;

  return (
    <HomeReveal className="w-full h-full">
      <HomeStaticPanel
        id="popular-tools-title"
        className="home-popular-tools"
        title={t("landing.popularToolsTitle")}
        icon={<Flame size={22} strokeWidth={1.75} />}
        toolbar={<HomeBatchActionsBar scopeIds={POPULAR_TOOL_IDS} />}
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
