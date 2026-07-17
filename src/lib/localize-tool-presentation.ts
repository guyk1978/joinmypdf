/**
 * Resolve localized title/description for tool modal + cards.
 * Prefers Tools.message keys; never silently switches locale.
 */
import { translateToolItem, translateToolIntent } from "@/lib/i18n-tool-labels";
import { getToolCardDescription } from "@/data/tool-card-descriptions";
import { getToolsDataEntry } from "@/data/tools-data";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { registry } from "@/lib/registry";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";

type ToolsTranslator = {
  (key: string, values?: Record<string, string | number>): string;
  has: (key: string) => boolean;
};

export type LocalizedToolPresentation = {
  slug: string;
  title: string;
  description: string;
};

export function localizeToolPresentation(
  rawSlug: string,
  tTools: ToolsTranslator,
  fallbacks?: { title?: string; description?: string },
): LocalizedToolPresentation {
  const slug = resolveCanonicalToolSlug(rawSlug);
  const data = getToolsDataEntry(slug);
  const inventory = getToolsInventoryEntry(slug);
  const registryTool = registry.tools.find((tool) => tool.slug === slug);

  const englishTitle =
    fallbacks?.title ||
    registryTool?.title ||
    data?.title ||
    inventory?.title ||
    slug;

  const title = translateToolItem(tTools, slug, englishTitle);

  let description = "";
  if (tTools.has(`cardDescriptions.${slug}`)) {
    description = tTools(`cardDescriptions.${slug}`);
  } else if (registryTool?.intent) {
    description = translateToolIntent(tTools, slug, registryTool.intent);
  } else {
    description =
      fallbacks?.description ||
      getToolCardDescription(slug, data?.description || inventory?.description) ||
      "";
  }

  return { slug, title, description };
}
