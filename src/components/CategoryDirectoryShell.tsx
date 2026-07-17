import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import {
  ToolsDirectoryDashboard,
  type DirectoryWorkflowColumn,
} from "@/components/ToolsDirectoryDashboard";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import type { ToolGridItem } from "@/lib/tool-grid";

type CategoryDirectoryShellProps = {
  title: string;
  description: string;
  eyebrow?: string;
  categoryId?: InventoryCategoryId;
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
  categoryId,
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
        <CategoryDirectoryFlatGrid items={flatGridItems} categoryId={categoryId} />
      ) : (
        <ToolsDirectoryDashboard
          categoryId={categoryId}
          featuredItems={featuredItems}
          featuredTitle={featuredTitle}
          featuredDescription={featuredDescription}
          workflowColumns={workflowColumns}
        />
      )}
    </div>
  );
}
