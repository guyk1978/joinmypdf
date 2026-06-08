"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ToolGridCard } from "@/components/ToolGridCard";
import { useFavorites } from "@/hooks/useFavorites";
import type { ToolGridItem } from "@/lib/tool-grid";

type FavoritesToolGridProps = {
  items: ToolGridItem[];
};

export function FavoritesToolGrid({ items }: FavoritesToolGridProps) {
  const t = useTranslations("Favorites");
  const tHome = useTranslations("Home");
  const { favoriteIds, hydrated } = useFavorites();

  const favoriteItems = items.filter((item) => favoriteIds.includes(item.slugHint));

  return (
    <div className="home-tool-grid-shell mx-auto flex w-full max-w-[1400px] flex-col items-center">
      <header className="mb-8 w-full text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{t("title")}</h1>
        <p className="mt-2 text-sm text-neutral-400 md:text-base">{t("description")}</p>
      </header>

      {!hydrated ? (
        <p className="text-sm text-neutral-500">{t("loading")}</p>
      ) : favoriteItems.length === 0 ? (
        <div className="w-full max-w-md rounded-[20px] border border-white/5 bg-neutral-900/50 p-8 text-center backdrop-blur-md">
          <p className="text-sm text-neutral-400">{t("emptyState")}</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-600/90 px-8 py-3 text-sm font-bold tracking-wide text-white shadow-inner transition-colors hover:bg-emerald-600"
          >
            {tHome("allTools")}
          </Link>
        </div>
      ) : (
        <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 xl:gap-8">
          {favoriteItems.map((item) => (
            <ToolGridCard key={item.href} item={item} favoritesView />
          ))}
        </div>
      )}
    </div>
  );
}
