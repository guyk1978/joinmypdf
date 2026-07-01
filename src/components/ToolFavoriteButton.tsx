"use client";

import { clsx } from "clsx";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
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
        "tool-page-favorite-btn",
        favorited && "tool-page-favorite-btn--active",
        className,
      )}
      aria-label={favorited ? t("removeFromFavorites") : t("addToFavorites")}
      aria-pressed={favorited}
    >
      <Star
        className={clsx("tool-page-favorite-btn__icon", favorited && "fill-current")}
        strokeWidth={1.75}
        aria-hidden
      />
    </button>
  );
}
