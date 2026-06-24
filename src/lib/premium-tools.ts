import { translateToolItem } from "@/lib/i18n-tool-labels";
import { registry } from "@/lib/registry";
import { STUDIO_TOOLS } from "@/lib/studio-tools";
import { getToolDisplayLabel } from "@/lib/tool-labels";
import type { ToolGridItem } from "@/lib/tool-grid";

type ToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

/** Curated premium workflows — security, pro editing, conversions, and studio apps. */
export const PREMIUM_TOOL_SLUGS = [
  "sign-pdf",
  "protect-pdf",
  "redact-pdf",
  "safe-to-share-auditor",
  "remove-hidden-metadata",
  "flatten-pdf",
  "compare-pdf",
  "pdf-text-editor",
  "annotate-pdf",
  "repair-pdf",
  "pdf-password-recovery",
  "pdf-to-word",
  "word-to-pdf",
  "invoice-generator",
  "timeline-gantt-generator",
  "data-converter-visualizer",
] as const;

export function buildPremiumToolItems(tTools: ToolsTranslator): ToolGridItem[] {
  const items: ToolGridItem[] = [];

  for (const slug of PREMIUM_TOOL_SLUGS) {
    const registryTool = registry.tools.find((tool) => tool.slug === slug);
    if (registryTool) {
      items.push({
        href: `/tools/${slug}/`,
        label: translateToolItem(tTools, slug, getToolDisplayLabel(slug, registryTool.title)),
        slugHint: slug,
      });
      continue;
    }

    const studio = STUDIO_TOOLS.find((tool) => tool.slug === slug);
    if (studio) {
      items.push({
        href: studio.href,
        label: translateToolItem(tTools, slug, studio.title),
        slugHint: slug,
      });
    }
  }

  return items;
}
