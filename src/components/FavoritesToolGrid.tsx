"use client";

import { Link } from "@/i18n/navigation";
import { LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { EmptyState } from "@/components/EmptyState";
import { ToolCardGrid } from "@/components/ToolCardGrid";
import { ToolFavoriteBookmarkIcon } from "@/components/ToolFavoriteBookmarkIcon";
import { ToolGridCard } from "@/components/ToolGridCard";
import { useFavorites } from "@/hooks/useFavorites";
import { imBtnCta } from "@/lib/design-system";
import type { ToolGridItem } from "@/lib/tool-grid";

type FavoritesToolGridProps = {
  items: ToolGridItem[];
};

export function FavoritesToolGrid({ items }: FavoritesToolGridProps) {
  const t = useTranslations("Favorites");
  const { favoriteIds, hydrated } = useFavorites();
  const favoriteItems = items.filter((item) => favoriteIds.includes(item.slugHint));

  if (!hydrated) {
    return <p className="product-page-meta text-center">{t("loading")}</p>;
  }

  if (favoriteItems.length === 0) {
    return (
      <EmptyState
        icon={<ToolFavoriteBookmarkIcon favorited={false} size="empty" />}
        title={t("emptyTitle")}
        description={t("emptyState")}
      >
        <Link href="/tools/" className={clsx(imBtnCta, "im-btn-cta--rounded inline-flex gap-2")} prefetch={false}>
          <LayoutGrid className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          {t("exploreAllTools")}
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="product-page-dashboard w-full">
      <p className="product-page-meta" aria-live="polite">
        {t("savedCount", { count: favoriteItems.length })}
      </p>

      <ToolCardGrid className="tool-card-grid--directory favorites-tool-grid">
        {favoriteItems.map((item) => (
          <ToolGridCard key={item.href} item={item} favoritesView />
        ))}
      </ToolCardGrid>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link href="/projects/" className={clsx(imBtnCta, "im-btn-cta--rounded")} prefetch={false}>
          {t("viewProjects")}
        </Link>
      </div>
    </div>
  );
}
