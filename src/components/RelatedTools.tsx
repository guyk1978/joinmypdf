import { CompactToolCardGrid } from "@/components/CompactToolCardGrid";
import { registry } from "@/lib/registry";
import type { ToolDefinition } from "@/lib/types";

export function RelatedTools({ tool }: { tool: ToolDefinition }) {
  const slugs = tool.relatedTools || [];
  const others = registry.tools.filter((t) => slugs.includes(t.slug));
  if (!others.length) return null;
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Related tools</h2>
      <CompactToolCardGrid
        items={others.map((t) => ({
          href: `/tools/${t.slug}/`,
          label: t.title,
          slugHint: t.slug,
        }))}
      />
    </section>
  );
}
