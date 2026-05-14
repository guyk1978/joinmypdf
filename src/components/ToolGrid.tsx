import Link from "next/link";
import { registry } from "@/lib/registry";

export function ToolGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {registry.tools.map((t) => (
        <article
          key={t.slug}
          className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-sm shadow-black/30"
        >
          <h3 className="text-lg font-semibold text-ink">{t.title}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{t.intent}</p>
          <p className="mt-3 text-xs text-ink-muted">
            Extra pages cover mobile, tight deadlines, large files, and sensitive documents—same engine, clearer
            context.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-surface hover:bg-brand-deep"
              href={`/tools/${t.slug}/`}
            >
              Open tool
            </Link>
            <Link
              className="rounded-lg border border-white/15 px-3 py-2 text-sm text-ink hover:bg-white/5"
              href={`/tools/${t.slug}/#tool-workspace`}
            >
              Jump to upload
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
