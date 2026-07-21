"use client";

import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { useState } from "react";
import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useOptionalToolModal } from "@/components/tool-modal/ToolModalProvider";
import { useToolEmbedMode } from "@/components/tool-modal/useToolEmbedMode";
import { ToolCardExample } from "@/components/ToolCardExample";
import { ToolCardFocus } from "@/components/ToolCardFocus";
import { ToolRatingSummary } from "@/components/ToolRatingSummary";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  getCategoryAccentColor,
  getCategoryAccentCssVar,
  getContrastingInk,
  resolveToolAccentCategoryId,
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
  /** Parent category context — drives close-navigation target. */
  categoryId?: InventoryCategoryId;
  /** Category hub to restore when the tool modal closes. */
  returnHref?: string;
  /** When false, always navigate (skip modal). Default true. */
  openInModal?: boolean;
  /**
   * `tool-modal` — card click opens the workspace modal (hub default).
   * `focus` — card click opens the expanded focus popup (homepage sections).
   */
  interactionMode?: "tool-modal" | "focus";
  /**
   * Keep the solid cover (name only) at all times — no hover detail chrome.
   * Used with `interactionMode="focus"` on the homepage.
   */
  coverOnly?: boolean;
};

function slugFromHref(href: string): string {
  const cleaned = href.split("?")[0]?.split("#")[0] ?? href;
  const parts = cleaned.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? cleaned;
}

/**
 * Industrial Matte tool card — two-state overlay:
 * default = solid category fill + centered title; hover = full detail chrome.
 * Homepage can lock cover-only + open the focus popup on click.
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
  interactionMode = "tool-modal",
  coverOnly = false,
}: IndustrialToolCardProps) {
  const modal = useOptionalToolModal();
  const embed = useToolEmbedMode();
  const locale = useLocale();
  const tCard = useTranslations("ToolCard");
  const [focusOpen, setFocusOpen] = useState(false);
  const toolSlug = resolveCanonicalToolSlug(slug ?? slugFromHref(href));
  /** Hub context for modal close / return navigation. */
  const categoryId = resolveToolCategoryId(toolSlug, categoryIdProp);
  /** Per-tool accent so cover fills stay distinct across a shared hub grid. */
  const accentCategoryId =
    resolveToolAccentCategoryId(toolSlug, categoryId) ?? categoryId ?? "pdf";
  const nestedHref = categoryId ? resolveToolHref(toolSlug, categoryId, locale) : href;
  const returnHref =
    returnHrefProp ?? (categoryId ? normalizeHubPath(categoryId) : undefined);
  const coverInk = getContrastingInk(getCategoryAccentColor(accentCategoryId));
  const accentStyle = {
    "--category-accent": getCategoryAccentCssVar(accentCategoryId),
    "--im-tool-card-cover-ink": coverInk,
  } as CSSProperties;
  const focusInteraction = interactionMode === "focus";

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.button !== 0) return;

    if (focusInteraction) {
      event.preventDefault();
      setFocusOpen(true);
      return;
    }

    if (!openInModal || !modal || embed) return;
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

  const exampleKey = `examples.${toolSlug}`;
  const example = tCard.has(exampleKey)
    ? tCard(exampleKey)
    : locale === "en"
      ? getToolRealWorldExample(toolSlug)
      : undefined;

  return (
    <div
      className={clsx(
        "im-tool-card",
        coverOnly && "im-tool-card--cover-only",
        className,
      )}
      data-category={accentCategoryId}
      style={accentStyle}
    >
      {/* Overlay link keeps the whole card clickable while the example toggle
          and Focus expand button stay valid interactive siblings (never
          buttons nested inside an anchor). */}
      <Link
        href={nestedHref}
        className="im-tool-card__overlay"
        prefetch={false}
        aria-label={label}
        aria-haspopup={focusInteraction ? "dialog" : undefined}
        data-tool-modal-open={
          !focusInteraction && openInModal && modal && !embed ? "" : undefined
        }
        onClick={handleClick}
      />

      <span className="im-tool-card__cover" aria-hidden>
        <span className="im-tool-card__cover-title">{label}</span>
      </span>

      <ToolCardFocus
        slug={toolSlug}
        href={nestedHref}
        label={label}
        description={description}
        example={example}
        icon={icon}
        categoryId={accentCategoryId}
        open={focusInteraction ? focusOpen : undefined}
        onOpenChange={focusInteraction ? setFocusOpen : undefined}
        showExpandButton={!coverOnly}
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
          categoryId={accentCategoryId}
          className="im-tool-card__rating"
        />
      </span>
    </div>
  );
}
