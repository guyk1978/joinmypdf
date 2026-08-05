import type { ReactNode } from "react";
import { clsx } from "clsx";

type ToolCardGridProps = {
  children: ReactNode;
  className?: string;
};

/** Responsive grid for IndustrialToolCard lists — matches global im-tool-card-grid. */
export function ToolCardGrid({ children, className }: ToolCardGridProps) {
  return <div className={clsx("im-tool-card-grid", className)}>{children}</div>;
}
