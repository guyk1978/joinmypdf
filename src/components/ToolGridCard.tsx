"use client";

import { type MouseEvent } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { Star, X } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { useFavorites } from "@/hooks/useFavorites";
import { getToolIcon, TOOL_ICON_WRAP_CLASS } from "@/lib/tool-icons";
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
            "text-neutral-400 hover:border-neutral-600/40 hover:bg-white/[0.08] hover:text-neutral-100 dark:text-neutral-500 dark:hover:border-neutral-500/40 dark:hover:text-neutral-100",
          !showRemove &&
            (favorited
              ? "border-amber-500/30 bg-amber-500/10 text-amber-500 opacity-100 hover:border-amber-500/50 hover:bg-amber-500/15 dark:text-amber-400"
              : "text-neutral-500 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-500 dark:text-neutral-400 dark:hover:text-amber-400"),
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
          TOOL_ICON_WRAP_CLASS,
          "inline-flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-105",
          "[&_svg]:h-8 [&_svg]:w-8",
          visual.wrap,
          visual.wrapHover,
        )}
        aria-hidden
      >
        {visual.icon}
      </span>

      <span className={clsx("home-tool-grid-card__label", homeToolGridCardLabel)}>{item.label}</span>
    </Link>
  );
}
