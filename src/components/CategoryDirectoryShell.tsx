import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { CategoryDirectoryFooter } from "@/components/CategoryDirectoryFooter";
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
  backToHomeLabel: string;
  browseAllToolsLabel: string;
  footerNavLabel: string;
  showFooter?: boolean;
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
  backToHomeLabel,
  browseAllToolsLabel,
  footerNavLabel,
  showFooter = true,
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

      {showFooter ? (
        <CategoryDirectoryFooter
          backToHomeLabel={backToHomeLabel}
          browseAllToolsLabel={browseAllToolsLabel}
          footerNavLabel={footerNavLabel}
        />
      ) : null}
    </div>
  );
}
