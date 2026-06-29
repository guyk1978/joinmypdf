import { translateToolIntent, translateToolItem } from "@/lib/i18n-tool-labels";
import { buildMegaMenuSections, flattenMegaMenuSections } from "@/lib/mega-menu";
import { registry } from "@/lib/registry";
import { getToolDisplayLabel } from "@/lib/tool-labels";
import type { ToolGridItem } from "@/lib/tool-grid";

type ToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
};

export type HomeGridToolItem = ToolGridItem & {
  description: string;
};

export const FEATURED_HOME_TOOL_SLUGS = [
  "pdf-merge",
  "pdf-compress",
  "pdf-split",
  "pdf-to-word",
  "jpg-to-pdf",
  "protect-pdf",
  "sign-pdf",
  "word-to-pdf",
] as const;

/** Homepage grid — 12 most popular tools in a 3×4 accordion */
export const HOMEPAGE_GRID_TOOL_SLUGS = [
  "pdf-merge",
  "pdf-compress",
  "pdf-split",
  "jpg-to-pdf",
  "pdf-to-word",
  "protect-pdf",
  "sign-pdf",
  "word-to-pdf",
  "pdf-to-jpg",
  "rotate-pdf",
  "unlock-pdf",
  "delete-pdf-pages",
] as const;

export function getTotalToolCount(): number {
  return flattenMegaMenuSections(buildMegaMenuSections()).length;
}

export function buildFeaturedHomeToolItems(tTools: ToolsTranslator) {
  return FEATURED_HOME_TOOL_SLUGS.map((slug) => {
    const tool = registry.tools.find((item) => item.slug === slug);
    if (!tool) return null;

    return {
      href: `/tools/${tool.slug}/`,
      label: translateToolItem(tTools, tool.slug, getToolDisplayLabel(tool.slug, tool.title)),
      slugHint: tool.slug,
    };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export function buildHomepageGridToolItems(tTools: ToolsTranslator): HomeGridToolItem[] {
  return HOMEPAGE_GRID_TOOL_SLUGS.map((slug) => {
    const tool = registry.tools.find((item) => item.slug === slug);
    if (!tool) return null;

    return {
      href: `/tools/${tool.slug}/`,
      label: translateToolItem(tTools, tool.slug, getToolDisplayLabel(tool.slug, tool.title)),
      slugHint: tool.slug,
      description: translateToolIntent(tTools, tool.slug, tool.intent || tool.description),
    };
  }).filter((item): item is HomeGridToolItem => Boolean(item));
}

export function buildAllHomeToolItems(tTools: ToolsTranslator) {
  return flattenMegaMenuSections(buildMegaMenuSections()).map((item) => ({
    href: item.href,
    label: translateToolItem(tTools, item.slug, item.label),
    slugHint: item.slug,
  }));
}
