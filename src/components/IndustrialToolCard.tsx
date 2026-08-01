"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { ToolCardFocus } from "@/components/ToolCardFocus";
import { ToolCardGoLink } from "@/components/ToolCardGoLink";
import { ToolPinButton } from "@/components/ToolPinButton";
import { useToolsDirectorySelection } from "@/components/ToolsDirectorySelectionContext";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import {
  getCategoryAccentCssVar,
  resolveToolAccentCategoryId,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";
import { getToolCardShortLabel } from "@/lib/tool-labels";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolRealWorldExampleByLocale } from "@/data/tool-real-world-examples-localized";

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
  /**
   * @deprecated Go always opens the tool page in the same tab.
   * Kept for call-site compatibility.
   */
  openInModal?: boolean;
  /**
   * `tool-modal` — Expand opens focus popup; main card opens the tool in the same tab.
   * `focus` — Expand / programmatic focus popup (homepage sections).
   */
  interactionMode?: "tool-modal" | "focus";
  /**
   * @deprecated Compact cards always show the action row; kept for call-site compatibility.
   */
  coverOnly?: boolean;
};

function slugFromHref(href: string): string {
  const cleaned = href.split("?")[0]?.split("#")[0] ?? href;
  const parts = cleaned.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? cleaned;
}

/**
 * Compact Industrial Matte tool card:
 * selectable body (same tab) + separate expand / pin squares.
 */
export function IndustrialToolCard({
  href,
  label,
  description,
  icon,
  className,
  slug,
  categoryId: categoryIdProp,
  interactionMode = "tool-modal",
}: IndustrialToolCardProps) {
  const locale = useLocale();
  const tCard = useTranslations("ToolCard");
  const tDirectory = useTranslations("ToolsDirectory");
  const [focusOpen, setFocusOpen] = useState(false);
  const toolSlug = resolveCanonicalToolSlug(slug ?? slugFromHref(href));
  const shortLabel = getToolCardShortLabel(toolSlug, label);
  /** Hub context for modal close / return navigation. */
  const categoryId = resolveToolCategoryId(toolSlug, categoryIdProp);
  /** Per-tool accent so covers stay distinct across a shared hub grid. */
  const accentCategoryId =
    resolveToolAccentCategoryId(toolSlug, categoryId) ?? categoryId ?? "pdf";
  const nestedHref = categoryId ? resolveToolHref(toolSlug, categoryId, locale) : href;
  const accentStyle = {
    "--category-accent": getCategoryAccentCssVar(accentCategoryId),
  } as CSSProperties;
  const focusInteraction = interactionMode === "focus";
  const selection = useToolsDirectorySelection();
  const selected = selection?.isSelected(toolSlug) ?? false;

  const exampleKey = `examples.${toolSlug}`;
  const example = tCard.has(exampleKey)
    ? tCard(exampleKey)
    : getToolRealWorldExampleByLocale(toolSlug, locale);

  const goAria = tCard("goAria", { label: shortLabel });

  return (
    <div
      className={clsx(
        "im-tool-card-row",
        selection && "im-tool-card-row--selectable",
        selected && "im-tool-card-row--selected",
        className,
      )}
      data-category={accentCategoryId}
      style={accentStyle}
    >
      <div
        className={clsx(
          "im-tool-card",
          selection && "im-tool-card--selectable",
          selected && "im-tool-card--selected",
        )}
      >
        {selection ? (
          <label
            className="im-tool-card__select"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              type="checkbox"
              className="im-tool-card__select-input"
              checked={selected}
              onChange={() => selection.toggle(toolSlug)}
              aria-label={tDirectory("selectForFavoritesAria", { label: shortLabel })}
            />
            <span className="im-tool-card__select-box" aria-hidden />
          </label>
        ) : null}

        <ToolCardGoLink
          href={nestedHref}
          className="im-tool-card__hit"
          aria-label={goAria}
          title={goAria}
        >
          <span className="im-tool-card__dot" aria-hidden />
          <span className="im-tool-card__title">{shortLabel}</span>
        </ToolCardGoLink>
      </div>

      <div className="im-tool-card__side-actions" role="group" aria-label={shortLabel}>
        <ToolCardFocus
          slug={toolSlug}
          href={nestedHref}
          label={shortLabel}
          description={description}
          example={example}
          icon={icon}
          categoryId={accentCategoryId}
          open={focusInteraction ? focusOpen : undefined}
          onOpenChange={focusInteraction ? setFocusOpen : undefined}
          showExpandButton
          className="im-tool-card__side-action im-tool-card__expand"
        />

        <ToolPinButton
          toolId={toolSlug}
          variant="card"
          className="im-tool-card__side-action im-tool-card__pin"
        />
      </div>
    </div>
  );
}
