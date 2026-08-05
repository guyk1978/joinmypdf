"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { ToolCardFocus } from "@/components/ToolCardFocus";
import { ToolCardGoLink } from "@/components/ToolCardGoLink";
import { ToolFavoriteBookmarkIcon } from "@/components/ToolFavoriteBookmarkIcon";
import { useFavorites } from "@/hooks/useFavorites";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { getToolCardDescription } from "@/data/tool-card-descriptions";
import {
  getCategoryAccentCssVar,
  resolveToolAccentCategoryId,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";
import { getToolCardEnglishLabel } from "@/lib/tool-labels";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolRealWorldExampleByLocale } from "@/data/tool-real-world-examples-localized";

export type MinimalToolCardProps = {
  href: string;
  label: string;
  /** Optional — used only in the focus overlay, not shown on the card. */
  description?: string;
  /** Optional — used only in the focus overlay. */
  icon?: ReactNode;
  className?: string;
  slug?: string;
  categoryId?: InventoryCategoryId;
  interactionMode?: "tool-modal" | "focus";
  /** Favorites list: show remove control beside maximize. */
  favoritesRemove?: boolean;
};

function slugFromHref(href: string): string {
  const cleaned = href.split("?")[0]?.split("#")[0] ?? href;
  const parts = cleaned.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? cleaned;
}

/**
 * Ultra-minimal tool card — accent stripe, English tool name,
 * and a subtle maximize control in the top-right corner.
 */
export function MinimalToolCard({
  href,
  label,
  description,
  icon,
  className,
  slug,
  categoryId: categoryIdProp,
  interactionMode = "tool-modal",
  favoritesRemove = false,
}: MinimalToolCardProps) {
  const locale = useLocale();
  const tCard = useTranslations("ToolCard");
  const tFav = useTranslations("Favorites");
  const [focusOpen, setFocusOpen] = useState(false);
  const { isFavorite, removeFavorite } = useFavorites();

  const toolSlug = resolveCanonicalToolSlug(slug ?? slugFromHref(href));
  const englishTitle = getToolCardEnglishLabel(toolSlug, label);
  const englishDescription = getToolCardDescription(toolSlug, description) ?? description;
  const categoryId = resolveToolCategoryId(toolSlug, categoryIdProp);
  const accentCategoryId =
    resolveToolAccentCategoryId(toolSlug, categoryId) ?? categoryId ?? "pdf";
  const nestedHref = categoryId ? resolveToolHref(toolSlug, categoryId, locale) : href;
  const focusInteraction = interactionMode === "focus";
  const favorited = isFavorite(toolSlug);

  const exampleKey = `examples.${toolSlug}`;
  const example = tCard.has(exampleKey)
    ? tCard(exampleKey)
    : getToolRealWorldExampleByLocale(toolSlug, locale);

  const accentStyle = {
    "--category-accent": getCategoryAccentCssVar(accentCategoryId),
  } as CSSProperties;

  const overlayIcon = icon ?? (
    <span className="im-tool-card__focus-fallback" aria-hidden />
  );

  return (
    <article
      className={clsx("im-tool-card", "im-tool-card--minimal", className)}
      data-category={accentCategoryId}
      style={accentStyle}
    >
      <span className="im-tool-card__stripe" aria-hidden />

      <div className="im-tool-card__minimal-actions">
        <ToolCardFocus
          slug={toolSlug}
          href={nestedHref}
          label={englishTitle}
          description={englishDescription}
          example={example}
          icon={overlayIcon}
          categoryId={accentCategoryId}
          open={focusInteraction ? focusOpen : undefined}
          onOpenChange={focusInteraction ? setFocusOpen : undefined}
          showExpandButton
          className="im-tool-card__icon-btn im-tool-card__expand"
        />
        {favoritesRemove ? (
          <button
            type="button"
            className="im-tool-card__icon-btn tool-card-bookmark tool-card-bookmark--visible tool-card-bookmark--remove"
            aria-label={tFav("removeFromList")}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              removeFavorite(toolSlug);
            }}
          >
            <ToolFavoriteBookmarkIcon favorited={favorited} showRemove />
          </button>
        ) : null}
      </div>

      <ToolCardGoLink
        href={nestedHref}
        className="im-tool-card__hit"
        aria-label={tCard("goAria", { label: englishTitle })}
      >
        <h3 className="im-tool-card__title" lang="en">
          {englishTitle}
        </h3>
      </ToolCardGoLink>
    </article>
  );
}
