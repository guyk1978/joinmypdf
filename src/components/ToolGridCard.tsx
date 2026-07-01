"use client";

import { type MouseEvent } from "react";
import { usePathname } from "@/i18n/navigation";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { ToolCard } from "@/components/ToolCard";
import { ToolFavoriteBookmarkIcon } from "@/components/ToolFavoriteBookmarkIcon";
import { useFavorites } from "@/hooks/useFavorites";
import { getToolIcon } from "@/lib/tool-icons";
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

  const bookmarkButton = (
    <button
      type="button"
      onClick={onBookmarkAction}
      className={clsx(
        "tool-card-bookmark",
        (showBookmarkAlways || showRemove) && "tool-card-bookmark--visible",
        favorited && !showRemove && "tool-card-bookmark--active",
        showRemove && "tool-card-bookmark--remove",
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

  if (isAccordion && accordion) {
    return (
      <ToolCard
        label={item.label}
        icon={visual.icon}
        onClick={accordion.onToggle}
        actionSlot={bookmarkButton}
        selected={accordion.isSelected}
        accordionAria={{
          expanded: accordion.isSelected,
          controls: accordion.panelId,
        }}
      />
    );
  }

  return (
    <ToolCard
      href={item.href}
      label={item.label}
      icon={visual.icon}
      actionSlot={bookmarkButton}
    />
  );
}
