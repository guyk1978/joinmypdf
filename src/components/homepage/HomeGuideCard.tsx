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
 * Compact homepage guide card — full-body link + separate expand square.
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
  const resolvedIcon = icon ?? <BookOpen size={20} strokeWidth={1.75} aria-hidden />;
  const metaLine = [description, readTime].filter(Boolean).join(" · ");

  return (
    <div
      className={clsx("im-tool-card-row", className)}
      data-category={categoryId}
      style={accentStyle}
    >
      <ToolCardGoLink
        href={href}
        className="im-tool-card im-tool-card__hit im-tool-card__hit--solo"
        aria-label={openLabel}
        title={openLabel}
      >
        <span className="im-tool-card__dot" aria-hidden />
        <span className="im-tool-card__title">{label}</span>
      </ToolCardGoLink>

      <div className="im-tool-card__side-actions" role="group" aria-label={label}>
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
          className="im-tool-card__side-action im-tool-card__expand"
        />
      </div>
    </div>
  );
}
