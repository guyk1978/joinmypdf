import type { ReactNode } from "react";
import { clsx } from "clsx";

type ToolCardGridProps = {
  children: ReactNode;
  className?: string;
};

/** Responsive grid for ToolCard lists — matches homepage section layout. */
export function ToolCardGrid({ children, className }: ToolCardGridProps) {
  return <div className={clsx("tool-card-grid", className)}>{children}</div>;
}
