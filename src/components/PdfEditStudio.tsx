"use client";

import { Magnifier, type MagnifierProps } from "@/components/Magnifier";
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
      <div className={clsx("flex items-center justify-center px-3 py-3 md:px-4 md:py-4", minHeight)}>
        {children}
      </div>
    </div>
  );
}

export type PdfStudioPageProps = {
  children: ReactNode;
  className?: string;
  /**
   * Hover/tap magnifier over the page sheet (default on).
   * Pass `false` for non-bitmap chrome (e.g. margin guides only).
   */
  magnifier?: boolean | Omit<MagnifierProps, "children">;
};

/** PDF page sheet above the studio surface — Magnifier enabled by default. */
export function PdfStudioPage({ children, className, magnifier = true }: PdfStudioPageProps) {
  const sheet = (
    <div
      className={clsx(
        "overflow-hidden rounded-none border border-neutral-300 bg-white dark:border-neutral-800 dark:bg-neutral-950",
        className,
      )}
      data-preview-inspect=""
    >
      {children}
    </div>
  );

  if (magnifier === false) return sheet;

  const magnifierProps = magnifier === true ? {} : magnifier;

  return (
    <Magnifier zoom={2.75} size={200} shape="circle" {...magnifierProps}>
      {sheet}
    </Magnifier>
  );
}
