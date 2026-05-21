import { clsx } from "clsx";

type Props = {
  className?: string;
};

/** Business/finance companion — guides, compare, and post-success panels. */
export function CalnexAppCrossLink({ className }: Props) {
  return (
    <aside
      className={clsx(
        "rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900/55 via-white/[0.02] to-brand/[0.04] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-6 sm:py-5",
        className
      )}
      aria-label="Partner tool: CalnexApp"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
        For business &amp; finance workflows
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Managing financial documents or loan comparisons? Generate clean amortization tables with{" "}
        <span className="font-medium text-ink">CalnexApp</span> and export them directly to PDF.
      </p>
      <a
        href="https://calnexapp.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 rounded-lg border border-brand/35 bg-brand/10 px-3.5 py-2 text-sm font-semibold text-brand transition hover:border-brand/50 hover:bg-brand/15"
      >
        Run loan calculator →
      </a>
    </aside>
  );
}
