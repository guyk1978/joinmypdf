"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { HomeHeroSword } from "@/components/HomeHeroSword";
import { ToolGridCard } from "@/components/ToolGridCard";
import type { ToolGridItem } from "@/lib/tool-grid";
import { homePrimaryPillBtn, homeSecondaryPillBtn } from "@/lib/tool-ui";

const HOME_HERO_IMAGE = "/Gemini_Generated_Image_geptrcgeptrcgept-removebg-preview.png";

type HomeToolGridProps = {
  items: ToolGridItem[];
};

export function HomeToolGrid({ items }: HomeToolGridProps) {
  const t = useTranslations("Home");

  return (
    <div className="home-tool-grid-shell mx-auto flex w-full flex-col items-center">
      <header className="home-hero">
        <div className="home-hero__visual">
          <Image
            src={HOME_HERO_IMAGE}
            alt=""
            width={420}
            height={280}
            className="home-hero__image"
            priority
          />
        </div>

        <HomeHeroSword className="home-hero__sword hidden shrink-0 text-neutral-400 dark:text-neutral-500 md:block" />

        <div className="home-hero__copy">
          <h1 className="home-hero__title">{t("headline")}</h1>
          <p className="home-hero__sub">{t("subHeader")}</p>
        </div>
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
