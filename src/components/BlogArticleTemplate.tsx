import type { ReactNode } from "react";
import { toolPageDashboardStack } from "@/lib/tool-ui";

type BlogArticleTemplateProps = {
  children: ReactNode;
};

/** Blog article shell — same width and spacing as tool / product pages. */
export function BlogArticleTemplate({ children }: BlogArticleTemplateProps) {
  return (
    <div className={toolPageDashboardStack}>
      <div className="tool-page-layout tool-page-layout--stacked blog-article-layout">{children}</div>
    </div>
  );
}
