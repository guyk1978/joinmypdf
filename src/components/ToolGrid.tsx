"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import { registry } from "@/lib/registry";
import { STUDIO_TOOLS } from "@/lib/studio-tools";
import { getToolDisplayLabel } from "@/lib/tool-labels";

export function ToolGrid() {
  const tTools = useTranslations("Tools");

  const toolItems = useMemo(
    () => [
      ...registry.tools.map((tool) => ({
        href: `/tools/${tool.slug}/`,
        label: translateToolItem(tTools, tool.slug, getToolDisplayLabel(tool.slug, tool.title)),
        slugHint: tool.slug,
      })),
      ...STUDIO_TOOLS.map((tool) => ({
        href: tool.href,
        label: translateToolItem(tTools, tool.slug, getToolDisplayLabel(tool.slug, tool.ctaLabel)),
        slugHint: tool.slug,
      })),
    ],
    [tTools],
  );

  return <CompactToolCardGrid items={toolItems} />;
}
