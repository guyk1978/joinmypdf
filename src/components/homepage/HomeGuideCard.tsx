"use client";

import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { clsx } from "clsx";
import { Link } from "@/i18n/navigation";
import { ToolCardFocus } from "@/components/ToolCardFocus";
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
 * Compact homepage guide card — short title + expand / go actions.
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
      className={clsx("im-tool-card", className)}
      data-category={categoryId}
      style={accentStyle}
    >
      <span className="im-tool-card__dot" aria-hidden />
      <span className="im-tool-card__title">{label}</span>

      <div className="im-tool-card__actions" role="group" aria-label={label}>
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
          className="im-tool-card__action im-tool-card__expand"
        />

        <Link
          href={href}
          className="im-tool-card__action im-tool-card__go"
          prefetch={false}
          aria-label={openLabel}
          title={openLabel}
        >
          <ArrowRight size={16} strokeWidth={2.4} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
