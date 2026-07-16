import type { ReactNode } from "react";
import { toolPageDashboardStack } from "@/lib/tool-ui";

type BlogArticleTemplateProps = {
  children: ReactNode;
};

/** Blog article shell — Industrial Matte documentation column (~800px). */
export function BlogArticleTemplate({ children }: BlogArticleTemplateProps) {
  return (
    <div className={toolPageDashboardStack}>
      <div className="tool-page-layout tool-page-layout--stacked blog-article-layout">{children}</div>
    </div>
  );
}
