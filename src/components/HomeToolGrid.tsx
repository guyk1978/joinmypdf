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
      <div className="home-sub-header">
        <p className="home-sub-header__text">{t("subHeader")}</p>
      </div>

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
