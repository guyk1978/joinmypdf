"use client";

import type { CSSProperties, ReactNode } from "react";
import { clsx } from "clsx";
import { BookOpen } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ToolCardFocus } from "@/components/ToolCardFocus";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  getCategoryAccentColor,
  getCategoryAccentCssVar,
  getContrastingInk,
} from "@/lib/category-accent-colors";

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
 * Category-parity card for homepage workflow guides:
 * solid cover → hover reveals detail chrome → Maximize2 opens focus popup.
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
  const coverInk = getContrastingInk(getCategoryAccentColor(categoryId));
  const accentStyle = {
    "--category-accent": getCategoryAccentCssVar(categoryId),
    "--im-tool-card-cover-ink": coverInk,
  } as CSSProperties;
  const resolvedIcon = icon ?? <BookOpen size={20} strokeWidth={1.75} aria-hidden />;
  const metaLine = [description, readTime].filter(Boolean).join(" · ");

  return (
    <div
      className={clsx("im-tool-card", className)}
      data-category={categoryId}
      style={accentStyle}
    >
      <Link
        href={href}
        className="im-tool-card__overlay"
        prefetch={false}
        aria-label={label}
      />

      <span className="im-tool-card__cover" aria-hidden>
        <span className="im-tool-card__cover-title">{label}</span>
      </span>

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
      />

      <span className="im-tool-card__icon" aria-hidden>
        {resolvedIcon}
      </span>
      <span className="im-tool-card__body">
        <span className="im-tool-card__content">
          <span className="im-tool-card__title">{label}</span>
          {description ? <span className="im-tool-card__description">{description}</span> : null}
          {readTime ? (
            <span className="im-tool-card__description" style={{ opacity: 0.85 }}>
              {readTime}
            </span>
          ) : null}
        </span>
      </span>
    </div>
  );
}
