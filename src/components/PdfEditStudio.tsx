import { clsx } from "clsx";
import type { ReactNode } from "react";

/** Matte editing studio backdrop behind the PDF page. */
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
        "overflow-hidden rounded-none border border-neutral-300 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950",
        className,
      )}
    >
      <div className={clsx("flex items-center justify-center px-3 py-3 md:px-6 md:py-4", minHeight)}>
        {children}
      </div>
    </div>
  );
}

/** PDF page sheet above the studio surface. */
export function PdfStudioPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-none border border-neutral-300 bg-white dark:border-neutral-800 dark:bg-neutral-950",
        className,
      )}
    >
      {children}
    </div>
  );
}
