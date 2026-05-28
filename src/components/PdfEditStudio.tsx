import { clsx } from "clsx";
import type { ReactNode } from "react";

/** Premium “editing studio” backdrop — Canva-style surface behind the PDF page. */
export function PdfEditStudio({
  children,
  className,
  minHeight = "min-h-[300px]",
}: {
  children: ReactNode;
  className?: string;
  minHeight?: string;
}) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50 to-slate-100/75",
        "shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)]",
        "dark:border-slate-800 dark:bg-slate-950 dark:from-slate-950 dark:to-slate-900",
        className,
      )}
    >
      <div className={clsx("flex items-center justify-center px-4 py-8 md:px-10 md:py-10", minHeight)}>
        {children}
      </div>
    </div>
  );
}

/** Floating PDF page — white sheet with depth above the studio surface. */
export function PdfStudioPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-lg border border-slate-200/90 bg-white",
        "shadow-xl shadow-slate-200/50",
        "dark:border-slate-700 dark:bg-white dark:shadow-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
