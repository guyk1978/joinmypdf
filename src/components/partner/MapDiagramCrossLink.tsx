import { clsx } from "clsx";

type Props = {
  className?: string;
};

/** Shown below the hero drop zone — visual pre-production partner. */
export function MapDiagramCrossLink({ className }: Props) {
  return (
    <aside
      className={clsx(
        "w-full rounded-xl border border-slate-700/90 bg-slate-900/45 px-4 py-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm sm:px-5 sm:py-4",
        className
      )}
      aria-label="Partner tool: MapDiagram"
    >
      <p className="text-sm leading-relaxed text-ink-muted">
        Creating a presentation or workflow? Build flowcharts &amp; system designs visually with{" "}
        <span className="font-medium text-ink">MapDiagram</span>, then bring them here to merge.
      </p>
      <a
        href="https://mapdiagram.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-brand transition hover:text-brand-deep"
      >
        Open MapDiagram editor →
      </a>
    </aside>
  );
}
