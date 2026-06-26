import type { ReactNode } from "react";
import { clsx } from "clsx";

type ToolPageInfoBlockProps = {
  children: ReactNode;
  className?: string;
};

/** Guides, related tools, and FAQ below the upload zone. */
export function ToolPageInfoBlock({ children, className }: ToolPageInfoBlockProps) {
  return <div className={clsx("tool-page-info-block", className)}>{children}</div>;
}
