import type { ReactNode } from "react";
import { clsx } from "clsx";
import { CategoryLocalFirstBanner } from "@/components/CategoryLocalFirstBanner";
import "@/styles/category-hub-marketing.css";

type CategoryHubSplitProps = {
  /** About / FAQ / related hubs / guides — stacked below the tool grid. */
  content: ReactNode;
  /** Tool card grids / groups — directly under the hero. */
  tools: ReactNode;
  className?: string;
  /** Hide the local-first guarantee banner between tools and content. */
  hideLocalFirstBanner?: boolean;
};

/**
 * Shared category hub body layout:
 * tools grid → local-first banner → explanatory content (About / FAQ / related).
 */
export function CategoryHubSplit({
  content,
  tools,
  className,
  hideLocalFirstBanner = false,
}: CategoryHubSplitProps) {
  return (
    <div className={clsx("category-hub-split", className)}>
      <div className="category-hub-split__tools">{tools}</div>
      {hideLocalFirstBanner ? null : <CategoryLocalFirstBanner />}
      {content ? <div className="category-hub-split__content">{content}</div> : null}
    </div>
  );
}
