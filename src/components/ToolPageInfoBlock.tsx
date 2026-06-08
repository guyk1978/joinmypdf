import type { ReactNode } from "react";

type ToolPageInfoBlockProps = {
  children: ReactNode;
};

/** Solid category-tinted block for guides, related tools, and FAQ below the upload zone. */
export function ToolPageInfoBlock({ children }: ToolPageInfoBlockProps) {
  return <div className="tool-page-info-block">{children}</div>;
}
