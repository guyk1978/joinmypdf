import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { getInventoryToolsByCategory } from "@/lib/tools-inventory-query";
import { clsx } from "clsx";

export type CategoryHubPageHeaderProps = {
  /** Inventory category used to compute the live tool count. */
  categoryId: InventoryCategoryId;
  title: string;
  description?: string;
  /** Optional eyebrow line above the title (directory shells). */
  eyebrow?: ReactNode;
  /** Optional breadcrumb trail above the title. */
  breadcrumbs?: ReactNode;
  /** Optional eyebrow / privacy line rendered under the description. */
  footerNote?: ReactNode;
  /** Extra content under the description. */
  children?: ReactNode;
  className?: string;
  /**
   * `bordered` — industrial hub header with bottom border (pdf/convert).
   * `directory` — tools-directory-page__head styles (mp3/png).
   */
  variant?: "bordered" | "directory";
  /**
   * When true, render an inner block (div) without an outer `<header>` /
   * directory head wrapper — for pages that already provide the shell.
   */
  nested?: boolean;
};

/**
 * Shared category hub page header with a live inventory tool-count badge.
 * Count matches CategoryHubsSection cards (getInventoryToolsByCategory).
 */
export async function CategoryHubPageHeader({
  categoryId,
  title,
  description,
  eyebrow,
  breadcrumbs,
  footerNote,
  children,
  className,
  variant = "bordered",
  nested = false,
}: CategoryHubPageHeaderProps) {
  const tDir = await getTranslations("ToolsDirectory");
  const toolCount = getInventoryToolsByCategory(categoryId).length;
  const toolCountLabel =
    toolCount === 1
      ? tDir("toolCount", { count: toolCount })
      : tDir("toolCountPlural", { count: toolCount });

  const body = (
    <>
      {breadcrumbs ? (
        <div className="tools-directory-page__breadcrumbs">{breadcrumbs}</div>
      ) : null}
      {eyebrow ? <p className="tools-directory-page__eyebrow">{eyebrow}</p> : null}
      <div className="category-hub-page-header__title-row">
        <h1
          className={
            variant === "directory"
              ? "tools-directory-page__title"
              : "category-hub-page-header__title"
          }
        >
          {title}
        </h1>
        {toolCount > 0 ? (
          <>
            <span className="category-hub-page-header__sep" aria-hidden="true">
              ·
            </span>
            <span className="category-hub-page-header__count" aria-label={toolCountLabel}>
              {toolCountLabel}
            </span>
          </>
        ) : null}
      </div>
      {description ? (
        <p
          className={
            variant === "directory"
              ? "tools-directory-page__desc"
              : "category-hub-page-header__desc"
          }
        >
          {description}
        </p>
      ) : null}
      {footerNote ? <p className="category-hub-page-header__note">{footerNote}</p> : null}
      {children}
    </>
  );

  if (nested) {
    return (
      <div
        className={clsx("category-hub-page-header__nested", className)}
        data-category={categoryId}
      >
        {body}
      </div>
    );
  }

  return (
    <header
      className={clsx(
        variant === "directory" ? "tools-directory-page__head" : "category-hub-page-header",
        className,
      )}
      data-category={categoryId}
    >
      {body}
    </header>
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
