"use client";

import { type MouseEvent } from "react";
import { usePathname } from "@/i18n/navigation";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { ToolCard } from "@/components/ToolCard";
import { ToolFavoriteBookmarkIcon } from "@/components/ToolFavoriteBookmarkIcon";
import { ToolPinButton } from "@/components/ToolPinButton";
import { useFavorites } from "@/hooks/useFavorites";
import { usePinnedTools } from "@/hooks/usePinnedTools";
import { ToolListIcon } from "@/components/ToolListIcon";
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
  const { isPinned, hydrated } = usePinnedTools();
  const slug = item.slugHint;
  const favorited = isFavorite(slug);
  const pinned = hydrated && isPinned(slug);
  const showRemove = favoritesView ?? pathname.includes("/favorites");
  const showBookmarkAlways = !showRemove && favorited;
  const isAccordion = Boolean(accordion);

  const onBookmarkAction = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (showRemove) removeFavorite(slug);
    else toggleFavorite(slug);
  };

  const icon = <ToolListIcon slug={item.slugHint} label={item.label} />;

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

  const actionSlot = (
    <div className="tool-card__actions">
      <ToolPinButton toolId={slug} variant="card" />
      {bookmarkButton}
    </div>
  );

  if (pinned) return null;

  if (isAccordion && accordion) {
    return (
      <ToolCard
        label={item.label}
        icon={icon}
        onClick={accordion.onToggle}
        actionSlot={actionSlot}
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
      icon={icon}
      actionSlot={actionSlot}
    />
  );
}
