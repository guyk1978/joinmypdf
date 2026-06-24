"use client";

import { Star } from "lucide-react";
import { clsx } from "clsx";
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
        "rounded-full p-1.5 transition-all hover:scale-105 active:scale-110",
        favorited
          ? "text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
          : "text-neutral-500 hover:text-amber-500 dark:text-neutral-500 dark:hover:text-amber-400",
        className,
      )}
      aria-label={favorited ? t("removeFromFavorites") : t("addToFavorites")}
      aria-pressed={favorited}
    >
      <Star
        className={clsx(
          "h-6 w-6",
          favorited && "fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400",
        )}
      />
    </button>
  );
}
