import type { ReactNode } from "react";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { getInventoryToolsByCategory } from "@/lib/tools-inventory-query";
import { clsx } from "clsx";
import "@/styles/home-landing.css";

export type CategoryHubPageHeaderProps = {
  /** Inventory category id (used for data attributes / analytics). */
  categoryId: InventoryCategoryId;
  title: string;
  description?: string;
  /** Optional eyebrow line above the title (directory shells). */
  eyebrow?: ReactNode;
  /** Optional breadcrumb trail above the hero. */
  breadcrumbs?: ReactNode;
  /** Optional privacy / note line under the description. */
  footerNote?: ReactNode;
  /** Extra content under the hero. */
  children?: ReactNode;
  className?: string;
  /**
   * Kept for call-site compatibility — hero layout is shared for all variants.
   */
  variant?: "bordered" | "directory";
  /**
   * When true, render without an outer wrapper — for pages that already provide the shell.
   */
  nested?: boolean;
};

/**
 * Category hub hero — title + description only (tool cards live in the grid below).
 */
export function CategoryHubPageHeader({
  categoryId,
  title,
  description,
  eyebrow,
  breadcrumbs,
  footerNote,
  children,
  className,
  nested = false,
}: CategoryHubPageHeaderProps) {
  const hero = (
    <>
      {breadcrumbs ? (
        <div className="tools-directory-page__breadcrumbs category-hub-hero__breadcrumbs">
          {breadcrumbs}
        </div>
      ) : null}

      <div
        className={clsx("home-landing__hero category-hub-hero", className)}
        data-category={categoryId}
      >
        <header className="home-landing__intro category-hub-hero__intro">
          {eyebrow ? <p className="tools-directory-page__eyebrow">{eyebrow}</p> : null}
          <h1 className="home-landing__title category-hub-hero__title">{title}</h1>
          {description ? (
            <p className="home-landing__tagline category-hub-hero__tagline">{description}</p>
          ) : null}
          {footerNote ? <p className="category-hub-page-header__note">{footerNote}</p> : null}
        </header>
      </div>

      {children}
    </>
  );

  if (nested) {
    return (
      <div className="category-hub-page-header__nested" data-category={categoryId}>
        {hero}
      </div>
    );
  }

  return (
    <div className="category-hub-page-header category-hub-page-header--hero" data-category={categoryId}>
      {hero}
    </div>
  );
}

/** Sync helper for callers that already have a translator and need only the count label. */
export function formatCategoryToolCountLabel(
  toolCount: number,
  tDir: { (key: string, values?: Record<string, number>): string },
): string {
  return toolCount === 1
    ? tDir("toolCount", { count: toolCount })
    : tDir("toolCountPlural", { count: toolCount });
}

export function getCategoryToolCount(categoryId: InventoryCategoryId): number {
  return getInventoryToolsByCategory(categoryId).length;
}
