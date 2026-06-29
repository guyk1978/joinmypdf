"use client";

import { type MouseEvent } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { ToolFavoriteBookmarkIcon } from "@/components/ToolFavoriteBookmarkIcon";
import { useFavorites } from "@/hooks/useFavorites";
import { getToolIcon, TOOL_ICON_BARE_CLASS } from "@/lib/tool-icons";
import {
  homeToolGridCard,
  homeToolGridCardBookmark,
  homeToolGridCardLabel,
} from "@/lib/tool-ui";
import { imCardSurface } from "@/lib/design-system";
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
  const t = useTranslations("Home");
  const tFav = useTranslations("Favorites");
  const pathname = usePathname() || "/";
  const { isFavorite, toggleFavorite, removeFavorite } = useFavorites();
  const slug = item.slugHint;
  const favorited = isFavorite(slug);
  const showRemove = favoritesView ?? pathname.includes("/favorites");
  const showBookmarkAlways = !showRemove && favorited;
  const isAccordion = Boolean(accordion);

  const onBookmarkAction = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (showRemove) removeFavorite(slug);
    else toggleFavorite(slug);
  };

  const visual = getToolIcon(item.slugHint, item.label);

  const cardClassName = clsx(
    "group home-tool-grid-card im-card-surface",
    homeToolGridCard,
    isAccordion && "home-tool-grid-card--accordion",
    accordion?.isSelected && "im-card-surface--selected home-tool-grid-card--selected",
  );

  const bookmarkButton = (
    <button
      type="button"
      onClick={onBookmarkAction}
      className={clsx(
        homeToolGridCardBookmark,
        (showBookmarkAlways || showRemove) && "opacity-100",
        favorited && !showRemove && "home-tool-grid-card__bookmark--active",
        showRemove && "home-tool-grid-card__bookmark--remove",
      )}
      aria-label={
        showRemove
          ? tFav("removeFromList")
          : favorited
            ? t("removeFromFavorites")
            : t("addToFavorites")
      }
      aria-pressed={!showRemove && favorited}
    >
      <ToolFavoriteBookmarkIcon favorited={favorited} showRemove={showRemove} />
    </button>
  );

  const icon = (
    <span
      className={clsx(
        "home-tool-grid-card__icon",
        TOOL_ICON_BARE_CLASS,
        "inline-flex items-center justify-center",
        "[&_svg]:h-14 [&_svg]:w-14 sm:[&_svg]:h-16 sm:[&_svg]:w-16 md:[&_svg]:h-[4.25rem] md:[&_svg]:w-[4.25rem]",
      )}
      aria-hidden
    >
      {visual.icon}
    </span>
  );

  const label = (
    <span className={clsx("im-card-surface__label home-tool-grid-card__label", homeToolGridCardLabel)}>{item.label}</span>
  );

  if (isAccordion && accordion) {
    return (
      <button
        type="button"
        role="listitem"
        className={cardClassName}
        aria-expanded={accordion.isSelected}
        aria-controls={accordion.panelId}
        onClick={accordion.onToggle}
      >
        {bookmarkButton}
        {icon}
        {label}
      </button>
    );
  }

  return (
    <Link href={item.href} className={cardClassName} prefetch={false}>
      {bookmarkButton}
      {icon}
      {label}
    </Link>
  );
}
