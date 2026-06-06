import { translateToolItem } from "@/lib/i18n-tool-labels";
import { buildMegaMenuSections, flattenMegaMenuSections } from "@/lib/mega-menu";
import { registry } from "@/lib/registry";
import { getToolDisplayLabel } from "@/lib/tool-labels";

type ToolsTranslator = {
  (key: string): string;
  has: (key: string) => boolean;
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
