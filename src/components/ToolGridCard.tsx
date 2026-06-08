"use client";

import { type MouseEvent } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { Star, Trash2 } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { useFavorites } from "@/hooks/useFavorites";
import { getToolIcon, TOOL_ICON_WRAP_CLASS } from "@/lib/tool-icons";
import { homeToolGridCard, homeToolGridCardLabel } from "@/lib/tool-ui";
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

  const onFavoriteAction = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (showRemove) removeFavorite(slug);
    else toggleFavorite(slug);
  };

  const visual = getToolIcon(item.slugHint, item.label);

  return (
    <Link href={item.href} className={clsx("group", homeToolGridCard)} prefetch={false}>
      <button
        type="button"
        onClick={onFavoriteAction}
        className={clsx(
          "absolute end-3 top-3 rounded-full p-1 transition-colors",
          showRemove
            ? "text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400"
            : favorited
              ? "text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
              : "text-neutral-400 hover:text-amber-500 dark:text-neutral-500 dark:hover:text-amber-400",
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
          <Trash2 className="h-4 w-4" />
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
          TOOL_ICON_WRAP_CLASS,
          "inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
          visual.wrap,
          visual.wrapHover,
        )}
        aria-hidden
      >
        {visual.icon}
      </span>
      <span className={homeToolGridCardLabel}>{item.label}</span>
    </Link>
  );
}
