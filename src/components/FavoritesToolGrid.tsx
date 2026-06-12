"use client";

import { Link } from "@/i18n/navigation";
import { LayoutGrid, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { ToolGridCard } from "@/components/ToolGridCard";
import { useFavorites } from "@/hooks/useFavorites";
import type { ToolGridItem } from "@/lib/tool-grid";
import { homePrimaryPillBtn } from "@/lib/tool-ui";

type FavoritesToolGridProps = {
  items: ToolGridItem[];
};

export function FavoritesToolGrid({ items }: FavoritesToolGridProps) {
  const t = useTranslations("Favorites");
  const { favoriteIds, hydrated } = useFavorites();

  const favoriteItems = items.filter((item) => favoriteIds.includes(item.slugHint));

  return (
    <div className="favorites-page-content home-tool-grid-shell mx-auto flex w-full max-w-[1440px] flex-col items-center">
      {!hydrated ? (
        <p className="favorites-page-content__loading text-sm text-neutral-500 dark:text-neutral-400">
          {t("loading")}
        </p>
      ) : favoriteItems.length === 0 ? (
        <div className="favorites-empty-state">
          <div className="favorites-empty-state__icon-wrap" aria-hidden>
            <Star className="h-9 w-9 fill-amber-400/20 text-amber-400" strokeWidth={1.75} />
          </div>
          <h2 className="favorites-empty-state__title">{t("emptyTitle")}</h2>
          <p className="favorites-empty-state__body">{t("emptyState")}</p>
          <Link href="/tools/" className={`${homePrimaryPillBtn} mt-8 gap-2 px-10`} prefetch={false}>
            <LayoutGrid className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            {t("exploreAllTools")}
          </Link>
        </div>
      ) : (
        <>
          <p className="favorites-page-content__count" aria-live="polite">
            {t("savedCount", { count: favoriteItems.length })}
          </p>
          <div className="home-tool-grid home-tool-grid--homepage favorites-tool-grid w-full">
            {favoriteItems.map((item) => (
              <ToolGridCard key={item.href} item={item} favoritesView />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
