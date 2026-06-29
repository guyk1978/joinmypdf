"use client";

import { useEffect, useState } from "react";

const COLUMN_BREAKPOINTS = [
  { minWidth: 1280, columns: 7 },
  { minWidth: 1024, columns: 6 },
  { minWidth: 768, columns: 5 },
  { minWidth: 640, columns: 4 },
  { minWidth: 0, columns: 3 },
] as const;

function resolveColumnCount(width: number): number {
  for (const breakpoint of COLUMN_BREAKPOINTS) {
    if (width >= breakpoint.minWidth) {
      return breakpoint.columns;
    }
  }
  return 3;
}

/** Matches `.home-tool-grid` / `.tools-directory-accordion-grid__row` breakpoints. */
export function useToolGridColumns(): number {
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const update = () => setColumns(resolveColumnCount(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return columns;
}
