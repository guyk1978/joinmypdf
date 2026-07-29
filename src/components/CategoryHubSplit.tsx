import type { ReactNode } from "react";
import { clsx } from "clsx";

type CategoryHubSplitProps = {
  /** About / FAQ / related hubs / guides — stacked below the tool grid. */
  content: ReactNode;
  /** Tool card grids / groups — directly under the hero. */
  tools: ReactNode;
  className?: string;
};

/**
 * Shared category hub body layout:
 * tools grid first, then explanatory content (About / FAQ / related) below.
 */
export function CategoryHubSplit({ content, tools, className }: CategoryHubSplitProps) {
  return (
    <div className={clsx("category-hub-split", className)}>
      <div className="category-hub-split__tools">{tools}</div>
      {content ? <div className="category-hub-split__content">{content}</div> : null}
    </div>
  );
}
