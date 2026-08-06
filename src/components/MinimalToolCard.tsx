"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { ToolCardGoLink } from "@/components/ToolCardGoLink";
import { ToolFavoriteBookmarkIcon } from "@/components/ToolFavoriteBookmarkIcon";
import { ToolPinButton } from "@/components/ToolPinButton";
import { ToolRatingSummary } from "@/components/ToolRatingSummary";
import { useFavorites } from "@/hooks/useFavorites";
import type { InventoryCategoryId } from "@/data/inventory-hubs";
import { getToolCardDescription } from "@/data/tool-card-descriptions";
import {
  getCategoryAccentCssVar,
  resolveToolAccentCategoryId,
  resolveToolCategoryId,
} from "@/lib/category-accent-colors";
import { resolveCanonicalToolSlug } from "@/lib/locale-tool-slugs";
import { getToolCardShortLabel } from "@/lib/tool-labels";
import { resolveToolHref } from "@/lib/tool-hierarchy";
import { getToolRealWorldExampleByLocale } from "@/data/tool-real-world-examples-localized";
import { renderTextWithLtrUnits } from "@/lib/text-direction";

export type MinimalToolCardProps = {
  href: string;
  label: string;
  /** Shown in the inline expand panel. */
  description?: string;
  /** Kept for call-site compatibility (not shown on the compact card). */
  icon?: ReactNode;
  className?: string;
  slug?: string;
  categoryId?: InventoryCategoryId;
  /** @deprecated Modal focus mode removed — prop kept for call-site compatibility. */
  interactionMode?: "tool-modal" | "focus";
  /** Favorites list: show remove control beside the nav arrow. */
  favoritesRemove?: boolean;
  /**
   * `filled` — solid category background (homepage tiles).
   * `stripe` — dark card + left category accent stripe (related tools).
   */
  chrome?: "filled" | "stripe";
};

function slugFromHref(href: string): string {
  const cleaned = href.split("?")[0]?.split("#")[0] ?? href;
  const parts = cleaned.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? cleaned;
}

/**
 * Ultra-minimal tool card — title toggles an overlay details panel;
 * the nav arrow navigates to the tool page.
 */
export function MinimalToolCard({
  href,
  label,
  description,
  className,
  slug,
  categoryId: categoryIdProp,
  favoritesRemove = false,
  chrome = "filled",
}: MinimalToolCardProps) {
  const locale = useLocale();
  const tCard = useTranslations("ToolCard");
  const tTools = useTranslations("Tools");
  const tFav = useTranslations("Favorites");
  const panelId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);
  const { isFavorite, removeFavorite, toggleFavorite } = useFavorites();

  const toolSlug = resolveCanonicalToolSlug(slug ?? slugFromHref(href));
  const displayTitle = getToolCardShortLabel(toolSlug, label);
  const cardDescription =
    getToolCardDescription(toolSlug, description, tTools) ?? description;
  const categoryId = resolveToolCategoryId(toolSlug, categoryIdProp);
  const accentCategoryId =
    resolveToolAccentCategoryId(toolSlug, categoryId) ?? categoryId ?? "pdf";
  const nestedHref = categoryId
    ? resolveToolHref(toolSlug, categoryId, locale)
    : href;
  const favorited = isFavorite(toolSlug);

  const exampleKey = `examples.${toolSlug}`;
  const example = tCard.has(exampleKey)
    ? tCard(exampleKey)
    : getToolRealWorldExampleByLocale(toolSlug, locale);

  const panelCopy = cardDescription || example || null;

  const accentStyle = {
    "--category-accent": getCategoryAccentCssVar(accentCategoryId),
  } as CSSProperties;

  useEffect(() => {
    if (!expanded) return;

    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && !root.contains(event.target)) {
        setExpanded(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  const toggleExpanded = () => setExpanded((open) => !open);

  return (
    <article
      ref={rootRef}
      className={clsx(
        "im-tool-card",
        "im-tool-card--minimal",
        chrome === "stripe" && "im-tool-card--stripe",
        expanded && "im-tool-card--expanded",
        className,
      )}
      data-category={accentCategoryId}
      data-chrome={chrome}
      data-expanded={expanded ? "1" : "0"}
      style={accentStyle}
    >
      <span className="im-tool-card__stripe" aria-hidden />

      <div className="im-tool-card__minimal-row">
        <button
          type="button"
          className="im-tool-card__hit"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={
            expanded
              ? tCard("closeFocus")
              : tCard("expandAria", { label: displayTitle })
          }
          onClick={toggleExpanded}
        >
          <h3 className="im-tool-card__title" lang={locale}>
            {displayTitle}
          </h3>
        </button>

        <div className="im-tool-card__minimal-actions">
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

          <ToolCardGoLink
            href={nestedHref}
            className="im-tool-card__nav-arrow"
            aria-label={tCard("goAria", { label: displayTitle })}
            title={tCard("openTool")}
            onClick={(event) => event.stopPropagation()}
          >
            <ChevronRight
              className="im-tool-card__nav-arrow-icon"
              strokeWidth={2.25}
              aria-hidden
            />
          </ToolCardGoLink>
        </div>
      </div>

      {expanded ? (
        <div
          id={panelId}
          className="im-tool-card__dropdown"
          role="region"
          aria-label={displayTitle}
          onClick={(event) => event.stopPropagation()}
        >
          {panelCopy ? (
            <p className="im-tool-card__dropdown-desc">
              {renderTextWithLtrUnits(panelCopy)}
            </p>
          ) : (
            <p className="im-tool-card__dropdown-desc im-tool-card__dropdown-desc--muted">
              {tCard("openTool")}
            </p>
          )}

          <div className="im-tool-card__dropdown-footer mt-4 flex flex-col gap-3 border-t border-gray-100 pt-3">
            <div className="im-tool-card__dropdown-rating-row flex items-center">
              <ToolRatingSummary
                toolId={toolSlug}
                categoryId={accentCategoryId}
                className="im-tool-card__dropdown-rating"
                showCount={false}
              />
            </div>
            <div className="im-tool-card__dropdown-actions flex items-center gap-2">
              <ToolPinButton
                toolId={toolSlug}
                variant="card"
                className="im-tool-card__dropdown-pin"
              />
              <button
                type="button"
                className={clsx(
                  "im-tool-card__dropdown-fav",
                  favorited && "im-tool-card__dropdown-fav--active",
                )}
                data-tooltip={
                  favorited
                    ? tFav("removeFromFavorites")
                    : tFav("addToFavorites")
                }
                aria-label={
                  favorited
                    ? tFav("removeFromFavorites")
                    : tFav("addToFavorites")
                }
                aria-pressed={favorited}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleFavorite(toolSlug);
                }}
              >
                <ToolFavoriteBookmarkIcon favorited={favorited} />
              </button>
              <ToolCardGoLink
                href={nestedHref}
                className="im-tool-card__dropdown-start flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                aria-label={tCard("goAria", { label: displayTitle })}
                onClick={(event) => event.stopPropagation()}
              >
                {tCard("start")}
                <ChevronRight
                  className="im-tool-card__dropdown-start-icon size-4 shrink-0"
                  strokeWidth={2.25}
                  aria-hidden
                />
              </ToolCardGoLink>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
