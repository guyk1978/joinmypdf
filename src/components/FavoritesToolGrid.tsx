"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ToolGridCard } from "@/components/ToolGridCard";
import { useFavorites } from "@/hooks/useFavorites";
import type { ToolGridItem } from "@/lib/tool-grid";
import { homeGlassPanel, homePrimaryPillBtn } from "@/lib/tool-ui";

type FavoritesToolGridProps = {
  items: ToolGridItem[];
};

export function FavoritesToolGrid({ items }: FavoritesToolGridProps) {
  const t = useTranslations("Favorites");
  const tHome = useTranslations("Home");
  const { favoriteIds, hydrated } = useFavorites();

  const favoriteItems = items.filter((item) => favoriteIds.includes(item.slugHint));

  return (
    <div className="home-tool-grid-shell mx-auto flex w-full flex-col items-center">
      <header className="mb-8 w-full text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 md:text-base">{t("description")}</p>
      </header>

      {!hydrated ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("loading")}</p>
      ) : favoriteItems.length === 0 ? (
        <div className={`${homeGlassPanel} favorites-empty-panel`}>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t("emptyState")}</p>
          <Link href="/" className={`${homePrimaryPillBtn} mt-6 px-8`}>
            {tHome("allTools")}
          </Link>
        </div>
      ) : (
        <div className="home-tool-grid">
          {favoriteItems.map((item) => (
            <ToolGridCard key={item.href} item={item} favoritesView />
          ))}
        </div>
      )}
    </div>
  );
}
