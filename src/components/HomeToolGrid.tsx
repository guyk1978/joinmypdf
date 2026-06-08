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
    <div className="home-tool-grid-shell mx-auto flex w-full max-w-[1400px] flex-col items-center">
      <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 xl:gap-8">
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
