import type { ReactNode } from "react";
import { toolPageDashboardStack } from "@/lib/tool-ui";

type BlogArticleTemplateProps = {
  children: ReactNode;
};

/**
 * Permanent full-page article shell — fills the AppPageShell 90% content rail.
 * Renders inside AppPageShell (site header + footer); never a modal.
 */
export function BlogArticleTemplate({ children }: BlogArticleTemplateProps) {
  return (
    <div className={toolPageDashboardStack}>
      <div className="tool-page-layout tool-page-layout--stacked blog-article-layout">
        {children}
      </div>
    </div>
  );
}
