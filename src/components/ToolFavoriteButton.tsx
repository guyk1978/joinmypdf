"use client";

import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { ToolFavoriteBookmarkIcon } from "@/components/ToolFavoriteBookmarkIcon";
import { useFavorites } from "@/hooks/useFavorites";

type ToolFavoriteButtonProps = {
  slug: string;
  className?: string;
};

export function ToolFavoriteButton({ slug, className }: ToolFavoriteButtonProps) {
  const t = useTranslations("Home");
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(slug);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(slug);
      }}
      className={clsx(
        "tool-favorite-bookmark-btn",
        favorited && "tool-favorite-bookmark-btn--active",
        className,
      )}
      aria-label={favorited ? t("removeFromFavorites") : t("addToFavorites")}
      aria-pressed={favorited}
    >
      <ToolFavoriteBookmarkIcon favorited={favorited} size="toolbar" />
    </button>
  );
}
