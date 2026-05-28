import Link from "next/link";
import { STUDIO_TOOLS } from "@/lib/studio-tools";

export function StudioToolCards() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {STUDIO_TOOLS.map((tool) => (
        <Link
          key={tool.slug}
          href={tool.href}
          className="group relative flex min-h-[108px] flex-col items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white px-3 py-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:border-slate-800 dark:bg-slate-900"
        >
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold tracking-wide text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            APP
          </span>
          <span className="mt-2 line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">{tool.ctaLabel}</span>
          {tool.badge ? (
            <span className="mt-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
              {tool.badge}
            </span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
