"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { HomeHero } from "@/components/HomeHero";
import { ToolGridCard } from "@/components/ToolGridCard";
import type { ToolGridItem } from "@/lib/tool-grid";
import { homePrimaryPillBtn, homeSecondaryPillBtn } from "@/lib/tool-ui";

type HomeToolGridProps = {
  items: ToolGridItem[];
};

export function HomeToolGrid({ items }: HomeToolGridProps) {
  const t = useTranslations("Home");

  return (
    <>
      <HomeHero />

      <div className="home-tool-grid-shell home-tool-grid-shell--homepage mx-auto flex w-full flex-col items-center">
        <div className="home-tool-grid home-tool-grid--homepage">
          {items.map((item) => (
            <ToolGridCard key={item.href} item={item} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/favorites/" className={homeSecondaryPillBtn}>
            {t("viewFavorites")}
          </Link>
          <Link href="/tools/" className={homePrimaryPillBtn}>
            {t("allTools")}
          </Link>
        </div>
      </div>
    </>
  );
}
