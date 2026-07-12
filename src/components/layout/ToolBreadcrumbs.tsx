"use client";

import { Link } from "@/i18n/navigation";
import type { ToolDefinition } from "@/lib/types";

export type ToolBreadcrumbItem = {
  label: string;
  href: string;
};

export type ToolBreadcrumbsProps = {
  tool: Pick<ToolDefinition, "slug" | "title" | "category">;
  category: string;
  /** Pre-built trail from `buildToolPageBreadcrumbs` / `buildToolBreadcrumbTrail`. */
  items: ToolBreadcrumbItem[];
};

/**
 * Shared tool-page breadcrumb chrome.
 * Always pass inventory-driven items: Home / All tools / [Category hub] / [Tool].
 */
export function ToolBreadcrumbs({ tool, category, items }: ToolBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="tool-breadcrumbs"
      data-tool-slug={tool.slug}
      data-tool-category={category}
    >
      <ol className="tool-breadcrumbs__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.href}-${index}`} className="tool-breadcrumbs__item">
              {isLast ? (
                <span className="tool-breadcrumbs__current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <Link href={item.href} className="tool-breadcrumbs__link">
                    {item.label}
                  </Link>
                  <span className="tool-breadcrumbs__sep" aria-hidden="true">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
