"use client";

import { type CSSProperties, type MouseEvent } from "react";
import { usePathname } from "@/i18n/navigation";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { ToolCardFocus } from "@/components/ToolCardFocus";
import { ToolCardGoLink } from "@/components/ToolCardGoLink";
import { ToolFavoriteBookmarkIcon } from "@/components/ToolFavoriteBookmarkIcon";
import { ToolPinButton } from "@/components/ToolPinButton";
import { useFavorites } from "@/hooks/useFavorites";
import { usePinnedTools } from "@/hooks/usePinnedTools";
import { ToolListIcon } from "@/components/ToolListIcon";
import {
  getCategoryAccentCssVar,
  resolveToolAccentCategoryId,
} from "@/lib/category-accent-colors";
import type { ToolGridItem } from "@/lib/tool-grid";

type ToolGridCardAccordionProps = {
  isSelected: boolean;
  onToggle: () => void;
  panelId: string;
};

type ToolGridCardProps = {
  item: ToolGridItem;
  /** Force favorites view (remove icon). Defaults to route detection. */
  favoritesView?: boolean;
  accordion?: ToolGridCardAccordionProps;
};

export function ToolGridCard({ item, favoritesView, accordion }: ToolGridCardProps) {
  const tFav = useTranslations("Favorites");
  const pathname = usePathname() || "/";
  const { isFavorite, removeFavorite } = useFavorites();
  const { isPinned, hydrated } = usePinnedTools();
  const slug = item.slugHint;
  const favorited = isFavorite(slug);
  const pinned = hydrated && isPinned(slug);
  const showRemove = favoritesView ?? pathname.includes("/favorites");
  const isAccordion = Boolean(accordion);
  const categoryId = resolveToolAccentCategoryId(slug);
  const accentStyle = categoryId
    ? ({ "--category-accent": getCategoryAccentCssVar(categoryId) } as CSSProperties)
    : undefined;

  const onBookmarkAction = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    removeFavorite(slug);
  };

  const icon = <ToolListIcon slug={item.slugHint} label={item.label} />;

  if (pinned) return null;

  const sideActions = (
    <div className="im-tool-card__side-actions" role="group" aria-label={item.label}>
      {showRemove || isAccordion ? null : (
        <ToolCardFocus
          slug={slug}
          href={item.href}
          label={item.label}
          icon={icon}
          categoryId={categoryId ?? undefined}
          showExpandButton
          className="im-tool-card__side-action im-tool-card__expand"
        />
      )}
      <ToolPinButton
        toolId={slug}
        variant="card"
        className="im-tool-card__side-action im-tool-card__pin"
      />
      {showRemove ? (
        <button
          type="button"
          onClick={onBookmarkAction}
          className="im-tool-card__side-action tool-card-bookmark tool-card-bookmark--visible tool-card-bookmark--remove"
          aria-label={tFav("removeFromList")}
        >
          <ToolFavoriteBookmarkIcon favorited={favorited} showRemove />
        </button>
      ) : null}
    </div>
  );

  if (isAccordion && accordion) {
    return (
      <div
        className={clsx(
          "im-tool-card-row",
          accordion.isSelected && "im-tool-card-row--selected",
        )}
        data-category={categoryId || undefined}
        style={accentStyle}
      >
        <button
          type="button"
          role="listitem"
          className={clsx(
            "im-tool-card",
            accordion.isSelected && "im-tool-card--selected",
          )}
          onClick={accordion.onToggle}
          aria-expanded={accordion.isSelected}
          aria-controls={accordion.panelId}
        >
          <span className="im-tool-card__dot" aria-hidden />
          <span className="im-tool-card__title">{item.label}</span>
        </button>
        {sideActions}
      </div>
    );
  }

  return (
    <div
      className="im-tool-card-row"
      data-category={categoryId || undefined}
      style={accentStyle}
    >
      <div className="im-tool-card">
        <ToolCardGoLink
          href={item.href}
          className="im-tool-card__hit"
          aria-label={item.label}
          title={item.label}
        >
          <span className="im-tool-card__dot" aria-hidden />
          <span className="im-tool-card__title">{item.label}</span>
        </ToolCardGoLink>
      </div>
      {sideActions}
    </div>
  );
}
