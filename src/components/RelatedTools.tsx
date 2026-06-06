import { getTranslations } from "next-intl/server";
import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
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
    <section className="space-y-2 rounded-none border border-neutral-300 bg-neutral-200 p-2 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-base font-semibold text-black dark:text-neutral-200">{tPage("relatedTools")}</h2>
      <CompactToolCardGrid
        items={others.map((item) => ({
          href: `/tools/${item.slug}/`,
          label: translateToolItem(tTools, item.slug, item.title),
          slugHint: item.slug,
        }))}
      />
    </section>
  );
}
