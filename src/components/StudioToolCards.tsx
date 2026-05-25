import Link from "next/link";
import { STUDIO_TOOLS } from "@/lib/studio-tools";

export function StudioToolCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {STUDIO_TOOLS.map((tool) => (
        <Link
          key={tool.slug}
          href={tool.href}
          className="studio-tool-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent p-6 shadow-sm shadow-black/30 transition duration-300 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-60"
            aria-hidden="true"
          />
          <div className="relative flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Studio tool</p>
            {tool.badge ? (
              <span className="shrink-0 rounded-full border border-brand/35 bg-brand/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand">
                {tool.badge}
              </span>
            ) : null}
          </div>
          <h3 className="relative mt-3 text-lg font-semibold text-ink transition-colors group-hover:text-brand">
            {tool.title}
          </h3>
          <p className="relative mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{tool.subtitle}</p>
          <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
            {tool.ctaLabel}
            <svg
              className="transition-transform duration-300 group-hover:translate-x-0.5"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Link>
      ))}
    </div>
  );
}
