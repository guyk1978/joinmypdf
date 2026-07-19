"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { clsx } from "clsx";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useOptionalToolModal } from "@/components/tool-modal/ToolModalProvider";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { ToolCardExample } from "@/components/ToolCardExample";
import { ToolCardFocus } from "@/components/ToolCardFocus";
import { ToolRatingSummary } from "@/components/ToolRatingSummary";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  getCategoryAccentCssVar,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";
import { normalizeHubPath, resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolRealWorldExample } from "@/data/tool-real-world-examples";

export type IndustrialToolCardProps = {
  href: string;
  label: string;
  description?: string;
  icon: ReactNode;
  className?: string;
  /** Tool slug for modal catalog (defaults to last path segment of href). */
  slug?: string;
  /** Parent category context — drives accent + close-navigation target. */
  categoryId?: InventoryCategoryId;
  /** Category hub to restore when the tool modal closes. */
  returnHref?: string;
  /** When false, always navigate (skip modal). Default true. */
  openInModal?: boolean;
};

function slugFromHref(href: string): string {
  const cleaned = href.split("?")[0]?.split("#")[0] ?? href;
  const parts = cleaned.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? cleaned;
}

/**
 * Industrial Matte tool card — matches homepage hub card chrome.
 * Accent and return path follow the parent category context.
 */
export function IndustrialToolCard({
  href,
  label,
  description,
  icon,
  className,
  slug,
  categoryId: categoryIdProp,
  returnHref: returnHrefProp,
  openInModal = true,
}: IndustrialToolCardProps) {
  const modal = useOptionalToolModal();
  const embed = useToolEmbedMode();
  const locale = useLocale();
  const toolSlug = resolveCanonicalToolSlug(slug ?? slugFromHref(href));
  /** Page-level category wins so hub pages share one accent (e.g. Image Tools). */
  const categoryId = resolveToolCategoryId(toolSlug, categoryIdProp);
  const nestedHref = categoryId ? resolveToolHref(toolSlug, categoryId, locale) : href;
  const returnHref =
    returnHrefProp ?? (categoryId ? normalizeHubPath(categoryId) : undefined);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!openInModal || !modal || embed) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.button !== 0) return;

    event.preventDefault();
    modal.openToolModal({
      slug: toolSlug,
      href: nestedHref,
      title: label,
      description,
      categoryId,
      returnHref,
    });
  };

  const example = getToolRealWorldExample(toolSlug);

  return (
    <div
      className={clsx("im-tool-card", className)}
      data-category={categoryId || undefined}
      style={
        categoryId
          ? ({ "--category-accent": getCategoryAccentCssVar(categoryId) } as CSSProperties)
          : undefined
      }
    >
      {/* Overlay link keeps the whole card clickable while the example toggle
          and Focus expand button stay valid interactive siblings (never
          buttons nested inside an anchor). */}
      <Link
        href={nestedHref}
        className="im-tool-card__overlay"
        prefetch={false}
        aria-label={label}
        data-tool-modal-open={openInModal && modal && !embed ? "" : undefined}
        onClick={handleClick}
      />
      <ToolCardFocus
        slug={toolSlug}
        href={nestedHref}
        label={label}
        description={description}
        example={example}
        icon={icon}
        categoryId={categoryId}
      />
      <span className="im-tool-card__icon" aria-hidden>
        {icon}
      </span>
      <span className="im-tool-card__body">
        <span className="im-tool-card__content">
          <span className="im-tool-card__title">{label}</span>
          {description ? <span className="im-tool-card__description">{description}</span> : null}
          {example ? <ToolCardExample example={example} /> : null}
        </span>
        <ToolRatingSummary
          toolId={toolSlug}
          categoryId={categoryId}
          className="im-tool-card__rating"
        />
      </span>
    </div>
  );
}
