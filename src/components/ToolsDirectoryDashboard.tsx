"use client";

import { ToolsDirectoryCategoryList } from "@/components/ToolsDirectoryCategoryList";
import { ToolsDirectoryToolLink } from "@/components/ToolsDirectoryToolLink";
import type { ToolGridItem } from "@/lib/tool-grid";

export type DirectoryWorkflowColumn = {
  id: string;
  title: string;
  description?: string;
  categories: {
    id: string;
    title: string;
    items: ToolGridItem[];
  }[];
};

type ToolsDirectoryDashboardProps = {
  featuredItems?: ToolGridItem[];
  featuredTitle?: string;
  featuredDescription?: string;
  workflowColumns: DirectoryWorkflowColumn[];
};

export function ToolsDirectoryDashboard({
  featuredItems = [],
  featuredTitle,
  featuredDescription,
  workflowColumns,
}: ToolsDirectoryDashboardProps) {
  return (
    <div className="tools-directory-dashboard">
      {featuredItems.length > 0 && featuredTitle ? (
        <section className="tools-directory-featured" aria-labelledby="tools-directory-featured-title">
          <h2 id="tools-directory-featured-title" className="tools-directory-featured__title">
            {featuredTitle}
          </h2>
          {featuredDescription ? (
            <p className="tools-directory-featured__desc">{featuredDescription}</p>
          ) : null}
          <ul className="tools-directory-featured__list">
            {featuredItems.map((item) => (
              <li key={item.slugHint}>
                <ToolsDirectoryToolLink href={item.href} label={item.label} slugHint={item.slugHint} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="tools-directory-workflows">
        {workflowColumns.map((column) => (
          <div key={column.id} className="tools-directory-workflow">
            <header className="tools-directory-workflow__head">
              <h2 className="tools-directory-workflow__title">{column.title}</h2>
              {column.description ? (
                <p className="tools-directory-workflow__desc">{column.description}</p>
              ) : null}
            </header>
            <div className="tools-directory-workflow__categories">
              {column.categories.map((category) => (
                <ToolsDirectoryCategoryList
                  key={category.id}
                  id={`tools-directory-${category.id}`}
                  title={category.title}
                  items={category.items}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
