import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import {
  ToolsDirectoryDashboard,
  type DirectoryWorkflowColumn,
} from "@/components/ToolsDirectoryDashboard";
import type { ToolGridItem } from "@/lib/tool-grid";

type CategoryDirectoryShellProps = {
  title: string;
  description: string;
  eyebrow?: string;
  featuredItems?: ToolGridItem[];
  featuredTitle?: string;
  featuredDescription?: string;
  workflowColumns: DirectoryWorkflowColumn[];
  flatGridItems?: ToolGridItem[];
};

export function CategoryDirectoryShell({
  title,
  description,
  eyebrow,
  featuredItems,
  featuredTitle,
  featuredDescription,
  workflowColumns,
  flatGridItems,
}: CategoryDirectoryShellProps) {
  return (
    <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page">
      <header className="tools-directory-page__head">
        {eyebrow ? <p className="tools-directory-page__eyebrow">{eyebrow}</p> : null}
        <h1 className="tools-directory-page__title">{title}</h1>
        <p className="tools-directory-page__desc">{description}</p>
      </header>

      {flatGridItems?.length ? (
        <CategoryDirectoryFlatGrid items={flatGridItems} />
      ) : (
        <ToolsDirectoryDashboard
          featuredItems={featuredItems}
          featuredTitle={featuredTitle}
          featuredDescription={featuredDescription}
          workflowColumns={workflowColumns}
        />
      )}
    </div>
  );
}
