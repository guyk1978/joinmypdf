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
    <section className="space-y-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{tPage("relatedTools")}</h2>
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
