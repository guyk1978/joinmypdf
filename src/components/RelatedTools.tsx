import { getTranslations } from "next-intl/server";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { ToolPageDashboardSection } from "@/components/ToolPageDashboardSection";
import { getAudioToolById } from "@/lib/audio-tools";
import { getRelatedInventoryToolIds } from "@/lib/tools-inventory-query";
import { getToolsInventoryEntry } from "@/data/tools-inventory";
import { registry } from "@/lib/registry";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import type { ToolDefinition } from "@/lib/types";

type RelatedToolsProps = {
  tool?: ToolDefinition;
  /** When SEO registry tool is unavailable (dedicated pages). */
  slug?: string;
};

export async function RelatedTools({ tool, slug }: RelatedToolsProps) {
  const toolSlug = tool?.slug ?? slug;
  if (!toolSlug) return null;

  const fromJson = tool?.relatedTools || [];
  const fromInventory = getRelatedInventoryToolIds(toolSlug, { limit: 10 });

  const orderedSlugs: string[] = [];
  for (const id of [...fromJson, ...fromInventory]) {
    if (id !== toolSlug && !orderedSlugs.includes(id)) orderedSlugs.push(id);
  }

  const items = orderedSlugs
    .map((id) => {
      const reg = registry.tools.find((entry) => entry.slug === id);
      if (reg) return { slug: reg.slug, title: reg.title };
      const audio = getAudioToolById(id);
      if (audio) return { slug: audio.id, title: audio.name };
      const inv = getToolsInventoryEntry(id);
      if (inv) return { slug: inv.id, title: inv.title };
      return null;
    })
    .filter((entry): entry is { slug: string; title: string } => Boolean(entry))
    .slice(0, 8);

  if (!items.length) return null;

  const tPage = await getTranslations("ToolPage");
  const tTools = await getTranslations("Tools");

  return (
    <ToolPageDashboardSection aria-labelledby="related-tools-heading">
      <h2
        id="related-tools-heading"
        className="mb-4 text-lg font-semibold tracking-wide text-ink dark:text-white"
      >
        {tPage.has("alsoCheckOut") ? tPage("alsoCheckOut") : tPage("relatedTools")}
      </h2>
      <CompactToolCardGrid
        variant="flat"
        items={items.map((item) => ({
          href: `/tools/${item.slug}/`,
          label: translateToolItem(tTools, item.slug, item.title),
          slugHint: item.slug,
        }))}
      />
    </ToolPageDashboardSection>
  );
}
