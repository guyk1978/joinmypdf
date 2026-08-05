"use client";

import type { CSSProperties, ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { clsx } from "clsx";
import { ToolCardFocus } from "@/components/ToolCardFocus";
import { ToolCardGoLink } from "@/components/ToolCardGoLink";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { getCategoryAccentCssVar } from "@/lib/category-accent-colors";

type HomeGuideCardProps = {
  href: string;
  label: string;
  description?: string;
  readTime?: string;
  openLabel: string;
  categoryId?: InventoryCategoryId;
  className?: string;
  icon?: ReactNode;
};

/**
 * Homepage guide card — ultra-minimal stripe + centered title + maximize.
 */
export function HomeGuideCard({
  href,
  label,
  description,
  readTime,
  openLabel,
  categoryId = "pdf",
  className,
  icon,
}: HomeGuideCardProps) {
  const accentStyle = {
    "--category-accent": getCategoryAccentCssVar(categoryId),
  } as CSSProperties;
  const resolvedIcon = icon ?? <BookOpen size={18} strokeWidth={1.75} aria-hidden />;
  const metaLine = [description, readTime].filter(Boolean).join(" · ");

  return (
    <article
      className={clsx("im-tool-card", "im-tool-card--minimal", className)}
      data-category={categoryId}
      style={accentStyle}
    >
      <span className="im-tool-card__stripe" aria-hidden />
      <div className="im-tool-card__minimal-actions">
        <ToolCardFocus
          slug={`guide-${href}`}
          href={href}
          label={label}
          description={metaLine || undefined}
          icon={resolvedIcon}
          categoryId={categoryId}
          showExpandButton
          showRating={false}
          openLabel={openLabel}
          className="im-tool-card__icon-btn im-tool-card__expand"
        />
      </div>
      <ToolCardGoLink href={href} className="im-tool-card__hit" aria-label={openLabel}>
        <h3 className="im-tool-card__title">{label}</h3>
      </ToolCardGoLink>
    </article>
  );
}
