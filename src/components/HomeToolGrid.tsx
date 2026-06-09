"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { ToolGridCard } from "@/components/ToolGridCard";
import type { ToolGridItem } from "@/lib/tool-grid";
import { homePrimaryPillBtn, homeSecondaryPillBtn } from "@/lib/tool-ui";

const HOME_HERO_TITLE_EN_DARK = "/heder-dark-EN-1.png";
const HOME_HERO_TITLE_HE_DARK = "/heder-dark-HE-1.png";
const HOME_HERO_TITLE_EN_LIGHT = "/heder-light-EN-1.png";
const HOME_HERO_TITLE_HE_LIGHT = "/heder-light-HE-1.png";

type HomeToolGridProps = {
  items: ToolGridItem[];
};

export function HomeToolGrid({ items }: HomeToolGridProps) {
  const t = useTranslations("Home");
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const isLight = (resolvedTheme ?? "light") !== "dark";

  const heroTitleImage =
    locale === "he"
      ? isLight
        ? HOME_HERO_TITLE_HE_LIGHT
        : HOME_HERO_TITLE_HE_DARK
      : isLight
        ? HOME_HERO_TITLE_EN_LIGHT
        : HOME_HERO_TITLE_EN_DARK;

  return (
    <>
      <header className="home-hero">
        <h1 className="home-hero__title">
          <img
            src={heroTitleImage}
            alt={t("headline")}
            className="home-hero__title-image h-auto w-full"
            width={1200}
            height={320}
          />
        </h1>
      </header>

      <div className="home-tool-grid-shell home-tool-grid-shell--homepage mx-auto flex w-full flex-col items-center">
        <div className="home-tool-grid home-tool-grid--homepage">
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
    </>
  );
}
