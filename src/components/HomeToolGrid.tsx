"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ToolGridCard } from "@/components/ToolGridCard";
import type { ToolGridItem } from "@/lib/tool-grid";
import { homePrimaryPillBtn, homeSecondaryPillBtn } from "@/lib/tool-ui";

type HomeToolGridProps = {
  items: ToolGridItem[];
};

export function HomeToolGrid({ items }: HomeToolGridProps) {
  const t = useTranslations("Home");

  return (
    <div className="home-tool-grid-shell mx-auto flex w-full flex-col items-center">
      <header className="home-sub-header flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-200 md:text-4xl">
          {t("headline")}
        </h1>
        <p className="text-lg font-medium leading-snug text-neutral-500 dark:text-neutral-400">
          {t("subHeader")}
        </p>
      </header>

      <div className="home-tool-grid">
        {items.map((item) => (
          <ToolGridCard key={item.href} item={item} />
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
        <Link href="/favorites/" className={homeSecondaryPillBtn}>
          {t("viewFavorites")}
        </Link>
        <Link href="/tools/" className={homePrimaryPillBtn}>
          {t("allTools")}
        </Link>
      </div>
    </div>
  );
}
