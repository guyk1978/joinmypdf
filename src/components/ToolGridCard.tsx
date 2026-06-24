"use client";

import { type MouseEvent } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { Star, X } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { useFavorites } from "@/hooks/useFavorites";
import { getToolIcon, TOOL_ICON_BARE_CLASS } from "@/lib/tool-icons";
import {
  homeToolGridCard,
  homeToolGridCardFavorite,
  homeToolGridCardLabel,
} from "@/lib/tool-ui";
import type { ToolGridItem } from "@/lib/tool-grid";

type ToolGridCardProps = {
  item: ToolGridItem;
  /** Force favorites view (trash icon). Defaults to route detection. */
  favoritesView?: boolean;
};

export function ToolGridCard({ item, favoritesView }: ToolGridCardProps) {
  const t = useTranslations("Home");
  const tFav = useTranslations("Favorites");
  const pathname = usePathname() || "/";
  const { isFavorite, toggleFavorite, removeFavorite } = useFavorites();
  const slug = item.slugHint;
  const favorited = isFavorite(slug);
  const showRemove = favoritesView ?? pathname.includes("/favorites");
  const showFavoriteAlways = !showRemove && favorited;

  const onFavoriteAction = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (showRemove) removeFavorite(slug);
    else toggleFavorite(slug);
  };

  const visual = getToolIcon(item.slugHint, item.label);

  return (
    <Link href={item.href} className={clsx("group home-tool-grid-card", homeToolGridCard)} prefetch={false}>
      <button
        type="button"
        onClick={onFavoriteAction}
        className={clsx(
          homeToolGridCardFavorite,
          showFavoriteAlways && "opacity-100",
          showRemove &&
            "text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300",
          !showRemove &&
            (favorited
              ? "text-amber-500 opacity-100 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
              : "text-neutral-400 hover:text-amber-500 dark:text-neutral-500 dark:hover:text-amber-400"),
        )}
        aria-label={
          showRemove
            ? tFav("removeFromList")
            : favorited
              ? t("removeFromFavorites")
              : t("addToFavorites")
        }
      >
        {showRemove ? (
          <X className="h-3.5 w-3.5" strokeWidth={2.25} />
        ) : (
          <Star
            className={clsx(
              "h-4 w-4",
              favorited && "fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400",
            )}
          />
        )}
      </button>

      <span
        className={clsx(
          "home-tool-grid-card__icon",
          TOOL_ICON_BARE_CLASS,
          "inline-flex items-center justify-center transition-transform duration-300 group-hover:scale-105",
          "[&_svg]:h-16 [&_svg]:w-16 sm:[&_svg]:h-[4.5rem] sm:[&_svg]:w-[4.5rem] md:[&_svg]:h-20 md:[&_svg]:w-20",
        )}
        aria-hidden
      >
        {visual.icon}
      </span>

      <span className={clsx("home-tool-grid-card__label", homeToolGridCardLabel)}>{item.label}</span>
    </Link>
  );
}
