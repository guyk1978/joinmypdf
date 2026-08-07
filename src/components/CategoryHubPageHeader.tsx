import type { ReactNode } from "react";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { getCategoryHubMarketing } from "@/data/category-hub-marketing";
import { getInventoryToolsByCategory } from "@/lib/tools-inventory-query";
import { clsx } from "clsx";
import "@/styles/category-hub-marketing.css";

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
  /**
   * When false, keep the caller title/description instead of marketing copy.
   * Default true — premium local-first hero for all hubs.
   */
  useMarketingCopy?: boolean;
};

/**
 * Category hub hero — bold local-first marketing header (matches homepage tone).
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
  useMarketingCopy = true,
}: CategoryHubPageHeaderProps) {
  const marketing = getCategoryHubMarketing(categoryId);
  const toolCount = getInventoryToolsByCategory(categoryId).length;
  const displayTitle = useMarketingCopy ? marketing.title : title;
  const displaySub =
    useMarketingCopy ? marketing.subtitle : description || marketing.subtitle;

  const hero = (
    <>
      <section
        className={clsx("chm-hero", className)}
        data-category={categoryId}
        aria-labelledby={`chm-hero-title-${categoryId}`}
      >
        <div className="chm-hero__glow" aria-hidden />
        <div className="chm-hero__inner">
          {breadcrumbs ? (
            <div className="chm-hero__breadcrumbs category-hub-hero__breadcrumbs">
              {breadcrumbs}
            </div>
          ) : null}
          <p className="chm-hero__brand">JoinMyPDF</p>
          {eyebrow ? <p className="chm-hero__eyebrow">{eyebrow}</p> : null}
          <h1 id={`chm-hero-title-${categoryId}`} className="chm-hero__title">
            {displayTitle}
          </h1>
          {displaySub ? <p className="chm-hero__sub">{displaySub}</p> : null}
          <ul className="chm-hero__pills" aria-label="Category benefits">
            <li>
              {toolCount} {toolCount === 1 ? "tool" : "tools"}
            </li>
            <li>Zero uploads</li>
            <li>Instant local processing</li>
          </ul>
          {footerNote ? <p className="chm-hero__note">{footerNote}</p> : null}
        </div>
      </section>

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
