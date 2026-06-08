"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ToolGridCard } from "@/components/ToolGridCard";
import type { ToolGridItem } from "@/lib/tool-grid";
import { homePrimaryPillBtn, homeSecondaryPillBtn } from "@/lib/tool-ui";

const HOME_HERO_TITLE_EN = "/heder-EN.png";
const HOME_HERO_TITLE_HE = "/heder-HE.png";
const HOME_HERO_IMAGE_EN = "/Gemini_Generated_Image_geptrcgeptrcgept-removebg-preview_3.png";
const HOME_HERO_IMAGE_HE = "/Gemini_Generated_Image_ficp5pficp5pficp-removebg-preview.png";

type HomeToolGridProps = {
  items: ToolGridItem[];
};

export function HomeToolGrid({ items }: HomeToolGridProps) {
  const t = useTranslations("Home");
  const locale = useLocale();
  const heroTitleImage = locale === "he" ? HOME_HERO_TITLE_HE : HOME_HERO_TITLE_EN;
  const heroImage = locale === "he" ? HOME_HERO_IMAGE_HE : HOME_HERO_IMAGE_EN;

  return (
    <div className="home-tool-grid-shell mx-auto flex w-full flex-col items-center">
      <header className="home-hero">
        <div className="home-hero__copy">
          <h1 className="home-hero__title">
            <img
              src={heroTitleImage}
              alt={t("headline")}
              className="home-hero__title-image"
              width={480}
              height={120}
            />
          </h1>
          <p className="home-hero__sub">{t("subHeader")}</p>
        </div>

        <div className="home-hero__visual">
          <Image
            src={heroImage}
            alt=""
            width={420}
            height={200}
            className="home-hero__image"
            priority
          />
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
