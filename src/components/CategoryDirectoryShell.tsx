import type { ReactNode } from "react";
import { CategoryDirectoryFlatGrid } from "@/components/CategoryDirectoryFlatGrid";
import { CategoryHubPageHeader } from "@/components/CategoryHubPageHeader";
import { CategoryHubSplit } from "@/components/CategoryHubSplit";
import { CategorySeoSection } from "@/components/CategorySeoSection";
import {
  ToolsDirectoryDashboard,
  type DirectoryWorkflowColumn,
} from "@/components/ToolsDirectoryDashboard";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import type { CategoryDirectoryId } from "@/lib/category-directory-config";
import type { ToolGridItem } from "@/lib/tool-grid";
import "@/styles/category-hub-marketing.css";
import "@/styles/home-landing.css";

type CategoryDirectoryShellProps = {
  title: string;
  description: string;
  eyebrow?: string;
  categoryId?: InventoryCategoryId;
  /** Directory id for the localized SEO prose + FAQ block below the grid. */
  seoId?: CategoryDirectoryId;
  featuredItems?: ToolGridItem[];
  featuredTitle?: string;
  featuredDescription?: string;
  workflowColumns: DirectoryWorkflowColumn[];
  flatGridItems?: ToolGridItem[];
  /** Breadcrumb trail rendered just above the category eyebrow/title. */
  breadcrumbs?: ReactNode;
};

export async function CategoryDirectoryShell({
  title,
  description,
  eyebrow,
  categoryId,
  seoId,
  featuredItems,
  featuredTitle,
  featuredDescription,
  workflowColumns,
  flatGridItems,
  breadcrumbs,
}: CategoryDirectoryShellProps) {
  const tools = flatGridItems?.length ? (
    <section className="tools-hub-panel category-hub-split__group" aria-label={title}>
      <CategoryDirectoryFlatGrid items={flatGridItems} categoryId={categoryId} />
    </section>
  ) : (
    <ToolsDirectoryDashboard
      categoryId={categoryId}
      featuredItems={featuredItems}
      featuredTitle={featuredTitle}
      featuredDescription={featuredDescription}
      workflowColumns={workflowColumns}
    />
  );

  return (
    <div className="home-minimal-layout home-minimal-layout--directory tools-directory-page tools-directory-page--hub-split page-container">
      {categoryId ? (
        <CategoryHubPageHeader
          categoryId={categoryId}
          title={title}
          description={description}
          eyebrow={eyebrow}
          breadcrumbs={breadcrumbs}
          variant="directory"
        />
      ) : (
        <header className="tools-directory-page__head">
          {breadcrumbs ? (
            <div className="tools-directory-page__breadcrumbs">{breadcrumbs}</div>
          ) : null}
          {eyebrow ? <p className="tools-directory-page__eyebrow">{eyebrow}</p> : null}
          <h1 className="tools-directory-page__title">{title}</h1>
          <p className="tools-directory-page__desc">{description}</p>
        </header>
      )}

      <CategoryHubSplit
        content={seoId ? <CategorySeoSection categoryId={seoId} /> : null}
        tools={tools}
      />
    </div>
  );
}
