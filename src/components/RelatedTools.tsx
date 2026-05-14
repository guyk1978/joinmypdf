import Link from "next/link";
import { registry } from "@/lib/registry";
import type { ToolDefinition } from "@/lib/types";

export function RelatedTools({ tool }: { tool: ToolDefinition }) {
  const slugs = tool.relatedTools || [];
  const others = registry.tools.filter((t) => slugs.includes(t.slug));
  if (!others.length) return null;
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <h2 className="text-lg font-semibold text-ink">Related tools</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {others.map((t) => (
          <li key={t.slug}>
            <Link
              className="inline-flex rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-brand hover:bg-white/5"
              href={`/tools/${t.slug}/`}
            >
              {t.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
