import { getTranslations } from "next-intl/server";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { ToolPageDashboardSection } from "@/components/ToolPageDashboardSection";
import { registry } from "@/lib/registry";
import { translateToolItem } from "@/lib/i18n-tool-labels";
import type { ToolDefinition } from "@/lib/types";

export async function RelatedTools({ tool }: { tool: ToolDefinition }) {
  const slugs = tool.relatedTools || [];
  const others = registry.tools.filter((t) => slugs.includes(t.slug));
  if (!others.length) return null;

  const tPage = await getTranslations("ToolPage");
  const tTools = await getTranslations("Tools");

  return (
    <ToolPageDashboardSection aria-labelledby="related-tools-heading">
      <h2
        id="related-tools-heading"
        className="mb-4 text-lg font-semibold tracking-wide text-ink dark:text-white"
      >
        {tPage("relatedTools")}
      </h2>
      <CompactToolCardGrid
        variant="glass"
        items={others.map((item) => ({
          href: `/tools/${item.slug}/`,
          label: translateToolItem(tTools, item.slug, item.title),
          slugHint: item.slug,
        }))}
      />
    </ToolPageDashboardSection>
  );
}
